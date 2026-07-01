import numpy as np
import pandas as pd
from typing import Dict, Any, List
from datetime import datetime

class ScoreService:
    @staticmethod
    def calculate_match_score(startup_profile: Dict[str, Any], investor_profile: Dict[str, Any]) -> int:
        """
        Calculates investor matchmaking score (0-100) using Pandas and NumPy.
        Accepts:
            startup_profile: {"industries": ["SaaS", "AI"], "stage": "Seed", "target_raise": 500000}
            investor_profile: {"focus": ["AI", "Web3"], "stage": "Seed", "preferences": {"min_check_size": 100000, "max_check_size": 1000000}}
        """
        s_industries = startup_profile.get("industries") or []
        s_stage = startup_profile.get("stage") or "Seed"
        s_raise = startup_profile.get("target_raise") or 500000.0

        i_focus = investor_profile.get("focus") or []
        i_stage = investor_profile.get("stage") or "Seed"
        i_prefs = investor_profile.get("preferences") or {}

        if isinstance(i_focus, str):
            i_focus = [i_focus]
        if isinstance(s_industries, str):
            s_industries = [s_industries]

        # 1. Industry Focus Match (Jaccard similarity)
        s_ind_set = set([ind.lower().strip() for ind in s_industries])
        i_foc_set = set([foc.lower().strip() for foc in i_focus])
        
        if not s_ind_set or not i_foc_set:
            industry_score = 0.0
        else:
            intersection = len(s_ind_set.intersection(i_foc_set))
            union = len(s_ind_set.union(i_foc_set))
            industry_score = intersection / union if union > 0 else 0.0

        # 2. Stage Match
        stage_score = 0.0
        if s_stage.lower().strip() == i_stage.lower().strip():
            stage_score = 1.0
        elif s_stage.lower().strip() in i_stage.lower().strip() or i_stage.lower().strip() in s_stage.lower().strip():
            stage_score = 0.5

        # 3. Check Size Check
        min_check = i_prefs.get("min_check_size") or 0.0
        max_check = i_prefs.get("max_check_size") or 999999999.0
        
        check_score = 0.0
        if min_check <= s_raise <= max_check:
            check_score = 1.0
        else:
            # Distance penalty decay
            midpoint = (min_check + max_check) / 2.0 if max_check != 999999999.0 else min_check * 2.0
            distance = np.abs(s_raise - midpoint)
            norm = midpoint if midpoint > 0 else 1.0
            check_score = float(np.exp(-distance / (2 * norm)))

        # Final Match calculation: Industry (50%), Stage (30%), Check (20%)
        final_score = (0.5 * industry_score + 0.3 * stage_score + 0.2 * check_score) * 100
        return int(np.clip(final_score, 0, 100))

    @staticmethod
    def calculate_priority_score(meetings: List[Dict[str, Any]], memories: List[Dict[str, Any]], followups: List[Dict[str, Any]]) -> int:
        """
        Calculates follow-up priority score (0-100) using numeric weights and time decay.
        """
        base_score = 30.0

        # 1. Recency of meeting bonus
        recent_meeting_bonus = 0.0
        if meetings:
            df_meetings = pd.DataFrame(meetings)
            df_meetings['date'] = pd.to_datetime(df_meetings['date'])
            last_meeting = df_meetings['date'].max()
            days_since = (datetime.utcnow() - last_meeting).days
            recent_meeting_bonus = 40.0 * np.exp(-np.abs(days_since - 2) / 7.0)

        # 2. Action items and concerns bonuses (from memories)
        action_item_bonus = 0.0
        concern_bonus = 0.0
        if memories:
            df_memories = pd.DataFrame(memories)
            if 'memory_type' in df_memories.columns:
                action_items = df_memories[df_memories['memory_type'] == 'action_item']
                action_item_bonus = min(len(action_items) * 15.0, 30.0)

                concerns = df_memories[df_memories['memory_type'] == 'concern']
                concern_bonus = min(len(concerns) * 10.0, 20.0)

        # 3. Pending followups bonus
        followup_bonus = 0.0
        if followups:
            df_followups = pd.DataFrame(followups)
            if 'status' in df_followups.columns:
                pending_followups = df_followups[df_followups['status'] == 'pending']
                followup_bonus = min(len(pending_followups) * 20.0, 40.0)

        total_score = base_score + recent_meeting_bonus + action_item_bonus + concern_bonus + followup_bonus
        return int(np.clip(total_score, 0, 100))

    @staticmethod
    def calculate_readiness_score(startup_profile: Dict[str, Any], memories: List[Dict[str, Any]]) -> int:
        """
        Calculates fundraising readiness score (0-100).
        """
        checklist = {
            "has_deck": 25,
            "has_financial_model": 25,
            "has_cap_table": 15,
            "has_one_pager": 15,
            "has_legal_setup": 20
        }

        base_readiness = 0.0
        for item, weight in checklist.items():
            if startup_profile.get(item) is True or startup_profile.get(item) in ["true", "True", 1]:
                base_readiness += weight

        concern_penalty = 0.0
        if memories:
            df_mem = pd.DataFrame(memories)
            if 'memory_type' in df_mem.columns:
                concerns = df_mem[df_mem['memory_type'] == 'concern']
                concern_penalty = min(len(concerns) * 5.0, 25.0)

        final_score = base_readiness - concern_penalty
        return int(np.clip(final_score, 0, 100))
