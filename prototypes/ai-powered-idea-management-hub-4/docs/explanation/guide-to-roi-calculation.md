Our application implements a **normalized and relative approach to ROI** to ensure fairness, comparability, and privacy, moving away from requiring users to disclose sensitive financial data[cite: 1015, 1019]. Instead of raw currency, the system uses **dimensionless proxies** and **relative scoring** to calculate a "Value Score"[cite: 1019].

---
## Calculating Value: From User Input to Normalized Score

The process involves several steps to translate qualitative user input into a standardized ROI metric:

### 1. User Input: Value and Effort Points
Users provide input on two main dimensions:

* **Value Points**: Contributors select a band (e.g., Band A, B, C, D) for various impact dimensions such as revenue impact, cost savings, customer NPS lift, or risk reduction[cite: 1022, 1023]. Each dimension has predefined qualitative bands and associated weights that reflect leadership priorities[cite: 1023, 1035]. For example, revenue impact might be weighted more heavily than NPS lift[cite: 1028, 1032]. The bands are qualitative to avoid users exposing confidential financial details[cite: 1035].
* **Effort Points**: Users estimate the effort required for an idea using a story-point-like scale (e.g., XS, S, M, L, XL), where each size corresponds to a numerical value (e.g., XS=1, S=3)[cite: 1035].

### 2. Calculating the Relative ROI Index
From these inputs, a **Relative ROI Index** is calculated using the formula[cite: 1035]:
$$\text{ROI}_\text{index} = \frac{\sum (\,\text{ValueBandScore}_i \times \text{Weight}_i\,)}{\text{EffortPoints}}$$
Here, the `ValueBandScore` (typically 1-4 corresponding to the selected band A-D) for each dimension is multiplied by its predefined weight, summed up, and then divided by the `EffortPoints`[cite: 1035].

---
## Anchoring and Normalization

### 3. Anchoring to Reference Ideas
To provide context to the `ROI_index`, the system uses **calibrated reference ideas** for each category[cite: 1036, 1037]. These are pre-defined examples with known `ROI_index` values (e.g., "Automate monthly invoice PDF upload" might have an `ROI_index` of 2.0)[cite: 1040]. During evaluation, the UI can then show how an idea compares to these benchmarks (e.g., "Your idea beats 70% of reference ideas")[cite: 1045].

### 4. Normalizing into a 0-100 Value Score
To create a single, comparable metric across all types of ideas, the `ROI_index` is converted into a **Value Score** ranging from 0 to 100[cite: 1021, 1045]. This is achieved by:
1.  Collecting the `ROI_index` for all ideas over a rolling 12-month period[cite: 1045].
2.  Calculating the **percentile rank** of each idea's `ROI_index` relative to this dataset[cite: 1046].
    $$\text{ValueScore} = \text{Percentile}( \text{ROI}_\text{index} )$$
An idea at the top of the `ROI_index` distribution will receive a Value Score near 100, while a median idea will score around 50[cite: 1046]. This `ValueScore` is then used in dashboards and evaluation rubrics instead of the raw `ROI_index`[cite: 1047].

---
## Integration and Usage

### 5. Wizard Integration
The dynamic fields in the idea submission wizard are configured to collect the necessary band selections for value dimensions and effort estimates[cite: 1056]. The front-end can provide real-time feedback by showing the calculated `ROI_index` as the user makes selections[cite: 1057]. The backend stores these band selections, computes the `ROI_index`, and a periodic (e.g., nightly) job recalculates the `ValueScore` for all ideas based on the updated percentile distribution[cite: 1057].

### 6. What Reviewers See
Reviewers see the normalized **Value Score** (e.g., "ValueScore 82/100") rather than absolute or abstract financial figures[cite: 1058]. Tooltips can provide context, such as how the idea compares to the median for its category and the band selections that contributed to its score[cite: 1058]. This allows supervisors to focus on relative ranking and strategic alignment[cite: 1059].

### 7. Minimizing Gaming and Bias
Several tactics are employed to maintain the integrity of the Value Score:
* **Band Guard-rails**: High-impact bands (e.g., "Critical" risk reduction or ">$250k" cost saving) may require users to attach evidence[cite: 1050].
* **Audit Trail**: Supervisors can adjust selected bands, and these changes are logged, allowing the system to learn[cite: 1051, 1052].
* **Periodic Re-scaling**: The percentile baseline for the Value Score is recomputed quarterly to prevent score inflation[cite: 1053, 1054].
* **Category-Specific Multipliers**: Optional bonuses can be applied to the Value Score for certain categories to reflect strategic priorities (e.g., a +10 bonus for Sustainability ideas)[cite: 1055].

This system allows the platform to assess and compare the potential ROI of diverse ideas in a standardized, privacy-respecting, and transparent manner[cite: 1060].