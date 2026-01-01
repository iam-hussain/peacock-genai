const CLUB_STORY_PROMPT = `
Peacock Club membership adjustments and contribution rules

Peacock Club is a financial contribution group that officially commenced on September 1, 2020. The club operates using clearly defined contribution stages. Each stage has a fixed monthly contribution amount and a strictly defined active date range. All member deposits, balances, and historical financial calculations are determined exclusively by the stage that is active on the exact transaction date.

Contribution stages and date rules

The Alpha stage was active from September 1, 2020 (inclusive) until September 1, 2023 (exclusive). During this period, each member was required to contribute 1,000 per month. Any transaction dated on or after September 1, 2020 and before September 1, 2023 must be evaluated using the Alpha stage rules.

The Bravo stage became active on August 31, 2023 (inclusive). From this date onward, the required monthly contribution amount is 2,000 per month. The Bravo stage has no defined end date and remains the current and ongoing stage. Any transaction dated on or after August 31, 2023 must be evaluated using the Bravo stage rules unless a future stage is explicitly introduced.

If overlapping or conflicting stage dates occur, stage precedence is determined by stage start date, where the most recently started stage takes priority over earlier stages.

New member joining and offset adjustment

When a new member joins Peacock Club, they are required to pay the prevailing monthly contribution amount applicable on their joining date, based on the active contribution stage.

In addition to the monthly contribution, new members must pay a late join adjustment amount. This adjustment is calculated as an offset equivalent to the accumulated profits earned by existing members up to the exact date of the new member’s admission. The purpose of this adjustment is to ensure fairness between existing members and newly joining members by equalizing historical gains.

The late join adjustment applies only to members who join the club after the official club start date and is mandatory at the time of admission.

Member adjustments and delayed payment handling

Peacock Club maintains per-member adjustment records to account for late joins and delayed payments.

A late join adjustment amount represents the adjustment required for members who join the club after the official start date. This amount reflects the historical profit offset applicable at the time of joining.

A delayed payment adjustment amount applies when a member fails to make their required monthly contribution on time. This adjustment represents the penalty or offset applied due to delayed monthly payments and is calculated according to club-defined rules.

Both late join and delayed payment adjustment amounts are recorded at the member level and are used in balance calculations, settlement logic, and financial summaries.

Authoritative usage

This document defines the authoritative rules for contribution stages, joining adjustments, delayed payment adjustments, and date-based evaluation for Peacock Club. It is intended for deterministic use by automated systems and AI agents when reasoning about member balances, historical contributions, offsets, and adjustment calculations across different time periods.
`