# ROI Pipeline Implementation

This document details the technical implementation of the ROI calculation and value score normalization pipeline in the Magure Idea Hub.

## Overview

The ROI pipeline transforms user-selected value bands into normalized value scores through a two-stage process:
1. **Real-time ROI calculation** using privacy-preserving band methodology
2. **Nightly percentile normalization** for comparative scoring across ideas

## ROI Calculation Formula

### Core Formula
Based on `docs/explanation/guide-to-roi-calculation.md`:

```
ROI Index = (Total Value Impact) / (Effort Investment)
```

Where:
- **Total Value Impact** = Sum of all selected value bands
- **Effort Investment** = Selected effort level multiplier

### Value Band Mapping

#### Revenue Impact Bands
```python
REVENUE_BANDS = {
    "NOT_APPLICABLE": 0,
    "BAND_A": 50000,      # Under $50K
    "BAND_B": 150000,     # $50K - $250K
    "BAND_C": 500000,     # $250K - $750K
    "BAND_D": 1250000,    # $750K - $1.75M
    "BAND_E": 3000000,    # $1.75M+
}
```

#### Cost Saving Bands
```python
COST_SAVING_BANDS = {
    "NOT_APPLICABLE": 0,
    "BAND_A": 25000,      # Under $25K
    "BAND_B": 75000,      # $25K - $125K
    "BAND_C": 250000,     # $125K - $375K
    "BAND_D": 625000,     # $375K - $875K
    "BAND_E": 1500000,    # $875K+
}
```

#### Risk Reduction Bands
```python
RISK_REDUCTION_BANDS = {
    "NOT_APPLICABLE": 0,
    "BAND_A": 10000,      # Under $10K
    "BAND_B": 50000,      # $10K - $90K
    "BAND_C": 200000,     # $90K - $310K
    "BAND_D": 500000,     # $310K - $690K
    "BAND_E": 1000000,    # $690K+
}
```

#### Effort Level Multipliers
```python
EFFORT_MULTIPLIERS = {
    "XS": 0.5,    # < 1 month
    "S": 1.0,     # 1-3 months
    "M": 2.5,     # 3-6 months
    "L": 5.0,     # 6-12 months
    "XL": 10.0,   # 12+ months
}
```

## Implementation Architecture

### Service Layer: `roi_service.py`

```python
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import statistics
from app.models.domain import IdeaValueAssessment
from app.core.supabase_client import SupabaseAsyncClient

class ROIService:
    def __init__(self, db: SupabaseAsyncClient):
        self.db = db
        self.band_values = self._load_band_configuration()
    
    async def calculate_roi_index(
        self, 
        value_selections: Dict[str, str], 
        effort_selection: str
    ) -> float:
        """Calculate ROI index from value band selections."""
        
        total_value = 0
        for dimension, band in value_selections.items():
            if dimension in self.band_values:
                total_value += self.band_values[dimension].get(band, 0)
        
        effort_multiplier = self.EFFORT_MULTIPLIERS.get(effort_selection, 1.0)
        
        if effort_multiplier == 0:
            return 0.0
            
        return total_value / (effort_multiplier * 100000)  # Normalize to base $100K
    
    async def calculate_value_score(
        self, 
        roi_index: float, 
        category: Optional[str] = None
    ) -> float:
        """Convert ROI index to percentile-based value score."""
        
        # Get historical ROI distribution
        historical_rois = await self._get_historical_roi_distribution(category)
        
        if not historical_rois:
            return min(roi_index * 50, 100)  # Fallback linear scaling
        
        # Calculate percentile
        percentile = self._calculate_percentile(roi_index, historical_rois)
        
        # Convert to 0-100 scale with exponential curve for higher differentiation
        return min(percentile * 1.2, 100)
    
    async def recalculate_all_value_scores(self) -> Dict[str, int]:
        """Nightly job to recalculate all value scores."""
        
        results = {"updated": 0, "errors": 0}
        
        # Get all ideas with ROI data
        ideas_query = await self.db.table("ideas")\
            .select("id, roi_index, tags!inner(category)")\
            .not_.is_("roi_index", "null")\
            .execute()
        
        ideas_by_category = {}
        for idea in ideas_query.data:
            primary_category = self._get_primary_category(idea["tags"])
            if primary_category not in ideas_by_category:
                ideas_by_category[primary_category] = []
            ideas_by_category[primary_category].append(idea)
        
        # Recalculate scores by category
        for category, ideas in ideas_by_category.items():
            try:
                roi_values = [idea["roi_index"] for idea in ideas]
                
                for idea in ideas:
                    new_score = await self.calculate_value_score(
                        idea["roi_index"], 
                        category
                    )
                    
                    # Update idea and create history record
                    await self._update_value_score(idea["id"], new_score)
                    results["updated"] += 1
                    
            except Exception as e:
                print(f"Error processing category {category}: {e}")
                results["errors"] += 1
        
        return results
    
    def _calculate_percentile(self, value: float, distribution: List[float]) -> float:
        """Calculate percentile rank of value in distribution."""
        if not distribution:
            return 50.0
            
        sorted_dist = sorted(distribution)
        count_below = sum(1 for x in sorted_dist if x < value)
        count_equal = sum(1 for x in sorted_dist if x == value)
        
        # Use midpoint method for ties
        percentile = (count_below + 0.5 * count_equal) / len(sorted_dist) * 100
        return min(max(percentile, 0), 100)
    
    async def _get_historical_roi_distribution(
        self, 
        category: Optional[str] = None
    ) -> List[float]:
        """Get historical ROI distribution for normalization."""
        
        query = self.db.table("ideas")\
            .select("roi_index")\
            .not_.is_("roi_index", "null")
        
        if category:
            query = query.select(
                "roi_index, idea_tags!inner(category)"
            ).eq("idea_tags.category", category)\
             .eq("idea_tags.is_primary", True)
        
        result = await query.execute()
        return [row["roi_index"] for row in result.data if row["roi_index"]]
    
    async def _update_value_score(self, idea_id: str, value_score: float):
        """Update idea value score and create history record."""
        
        # Update main idea record
        await self.db.table("ideas")\
            .update({"value_score": value_score, "updated_at": datetime.utcnow()})\
            .eq("id", idea_id)\
            .execute()
        
        # Create history record
        await self.db.table("idea_value_scores")\
            .insert({
                "idea_id": idea_id,
                "value_score": value_score,
                "recalculated_at": datetime.utcnow()
            })\
            .execute()
```

### API Endpoint: `PATCH /api/v1/ideas/{id}/value`

```python
@router.patch("/{idea_id}/value")
async def update_idea_value_bands(
    idea_id: UUID,
    value_data: IdeaValueBandUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    supabase: SupabaseAsyncClient = Depends(get_supabase_async_client),
    roi_service: ROIService = Depends(get_roi_service),
):
    """Update value band selections and recalculate ROI."""
    
    # Validate idea ownership/permissions
    idea = await idea_service.get_idea_by_id_from_db(supabase, idea_id)
    if not idea:
        raise HTTPException(404, "Idea not found")
    
    # Calculate new ROI index
    roi_index = await roi_service.calculate_roi_index(
        value_data.value_band_selections,
        value_data.effort_points_selection
    )
    
    # Get primary category for normalization
    primary_category = None
    for tag in idea.tags:
        if tag.is_primary:
            primary_category = tag.category
            break
    
    # Calculate normalized value score
    value_score = await roi_service.calculate_value_score(
        roi_index, 
        primary_category
    )
    
    # Update value selections in database
    await supabase.table("idea_value_selections")\
        .delete()\
        .eq("idea_id", idea_id)\
        .execute()
    
    for dimension, band in value_data.value_band_selections.items():
        await supabase.table("idea_value_selections")\
            .insert({
                "idea_id": idea_id,
                "dimension_key": dimension,
                "selected_band_key": band
            })\
            .execute()
    
    # Update idea with calculated values
    await supabase.table("ideas")\
        .update({
            "roi_index": roi_index,
            "value_score": value_score,
            "effort_selection": value_data.effort_points_selection,
            "updated_at": datetime.utcnow()
        })\
        .eq("id", idea_id)\
        .execute()
    
    return {
        "calculated_roi_index": roi_index,
        "normalized_value_score": value_score,
        "updated_at": datetime.utcnow()
    }
```

## Nightly Recalculation Job

### Supabase Edge Function

```sql
-- Create scheduled function for nightly recalculation
CREATE OR REPLACE FUNCTION recalculate_value_scores()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    category_rec RECORD;
    idea_rec RECORD;
    roi_distribution REAL[];
    new_score REAL;
BEGIN
    -- Process each category separately for better normalization
    FOR category_rec IN 
        SELECT DISTINCT category 
        FROM idea_tags 
        WHERE is_primary = true
    LOOP
        -- Get ROI distribution for this category
        SELECT ARRAY_AGG(roi_index ORDER BY roi_index) INTO roi_distribution
        FROM ideas i
        JOIN idea_tags t ON i.id = t.idea_id
        WHERE t.category = category_rec.category
        AND t.is_primary = true
        AND i.roi_index IS NOT NULL;
        
        -- Skip if no data
        CONTINUE WHEN array_length(roi_distribution, 1) IS NULL;
        
        -- Update each idea in this category
        FOR idea_rec IN
            SELECT i.id, i.roi_index
            FROM ideas i
            JOIN idea_tags t ON i.id = t.idea_id
            WHERE t.category = category_rec.category
            AND t.is_primary = true
            AND i.roi_index IS NOT NULL
        LOOP
            -- Calculate percentile-based score
            new_score := calculate_percentile_score(
                idea_rec.roi_index, 
                roi_distribution
            );
            
            -- Update idea
            UPDATE ideas 
            SET value_score = new_score, updated_at = NOW()
            WHERE id = idea_rec.id;
            
            -- Insert history record
            INSERT INTO idea_value_scores (
                idea_id, roi_index, value_score, recalculated_at
            ) VALUES (
                idea_rec.id, idea_rec.roi_index, new_score, NOW()
            );
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Value scores recalculated successfully';
END;
$$;

-- Schedule nightly execution (2 AM UTC)
SELECT cron.schedule(
    'recalculate-value-scores',
    '0 2 * * *',
    'SELECT recalculate_value_scores();'
);
```

### Helper Function for Percentile Calculation

```sql
CREATE OR REPLACE FUNCTION calculate_percentile_score(
    target_value REAL,
    distribution REAL[]
)
RETURNS REAL
LANGUAGE plpgsql
AS $$
DECLARE
    array_length INTEGER;
    count_below INTEGER := 0;
    count_equal INTEGER := 0;
    val REAL;
    percentile REAL;
BEGIN
    array_length := array_length(distribution, 1);
    
    -- Handle edge cases
    IF array_length IS NULL OR array_length = 0 THEN
        RETURN LEAST(target_value * 50, 100);
    END IF;
    
    -- Count values below and equal to target
    FOREACH val IN ARRAY distribution
    LOOP
        IF val < target_value THEN
            count_below := count_below + 1;
        ELSIF val = target_value THEN
            count_equal := count_equal + 1;
        END IF;
    END LOOP;
    
    -- Calculate percentile using midpoint method
    percentile := (count_below + 0.5 * count_equal) / array_length * 100;
    
    -- Apply exponential curve for better differentiation
    percentile := LEAST(percentile * 1.2, 100);
    
    RETURN GREATEST(LEAST(percentile, 100), 0);
END;
$$;
```

## Performance Considerations

### Database Indexes
```sql
-- Optimize ROI calculations
CREATE INDEX idx_ideas_roi_category ON ideas(roi_index) 
WHERE roi_index IS NOT NULL;

CREATE INDEX idx_idea_tags_primary_category ON idea_tags(category, is_primary) 
WHERE is_primary = true;

-- Value score history queries
CREATE INDEX idx_value_scores_idea_recalc ON idea_value_scores(idea_id, recalculated_at DESC);
```

### Caching Strategy
- **Category band values:** Cache in Redis for 24 hours
- **Historical distributions:** Cache for 1 hour, invalidate on recalculation
- **Individual ROI calculations:** No caching (real-time required)

### Monitoring & Alerting
```python
# Metrics to track
METRICS = {
    "roi_calculations_per_minute": "Counter",
    "value_score_recalculation_duration": "Histogram", 
    "roi_distribution_cache_hits": "Counter",
    "nightly_job_success_rate": "Gauge"
}

# Alerts
ALERTS = {
    "nightly_job_failure": "Critical",
    "roi_calculation_latency_high": "Warning",
    "value_score_distribution_skew": "Info"
}
```

## Testing Strategy

### Unit Tests
```python
class TestROIService:
    def test_roi_calculation_basic(self):
        """Test basic ROI calculation with known inputs."""
        
    def test_percentile_calculation(self):
        """Test percentile calculation accuracy."""
        
    def test_edge_cases(self):
        """Test zero values, missing data, etc."""

class TestNightlyJob:
    def test_category_isolation(self):
        """Ensure categories are processed independently."""
        
    def test_historical_preservation(self):
        """Verify history records are created correctly."""
```

### Integration Tests
```python
class TestROIPipeline:
    def test_end_to_end_calculation(self):
        """Test full pipeline from band selection to score."""
        
    def test_real_time_updates(self):
        """Test immediate ROI calculation on value updates."""
        
    def test_nightly_recalculation(self):
        """Test nightly job execution and results."""
```

This ROI pipeline implementation provides accurate, scalable value assessment while maintaining privacy through the band-based methodology and enabling comparative analysis through percentile normalization.
