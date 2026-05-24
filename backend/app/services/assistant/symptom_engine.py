"""Symptom triage — rule-based today, LLM-swappable tomorrow.

Maps free-text symptom descriptions to:
  - urgency tier (emergency / high / moderate / low)
  - required facility type (hospital, clinic, health_post, pharmacy)
  - plain-language explanation
  - immediate-action guidance

Tuned for the Ghanaian context: malaria, typhoid, sickle-cell crisis,
cholera, maternal complications, snake bite, road-traffic injury.

The dictionary is intentionally explicit so it's easy to audit and extend.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import List, Set
import re


Urgency = str  # "emergency" | "high" | "moderate" | "low"

EMERGENCY_PATTERNS = {
    "chest_pain":       ("chest pain", "heart attack", "pressure in chest"),
    "stroke":           ("face drooping", "arm weakness", "slurred speech",
                         "stroke", "one side weak", "cant speak"),
    "severe_bleeding":  ("bleeding heavily", "lots of blood", "wont stop bleeding",
                         "blood pouring", "haemorrhage", "hemorrhage"),
    "breathing":        ("cant breathe", "can't breathe", "trouble breathing",
                         "gasping", "choking", "shortness of breath severe"),
    "unconscious":      ("unconscious", "passed out", "fainted", "wont wake up",
                         "not responsive"),
    "seizure":          ("seizure", "convulsion", "fit", "fitting"),
    "severe_burn":      ("severe burn", "large burn", "burn covering",
                         "third degree burn"),
    "snake_bite":       ("snake bite", "snake bit", "bitten by snake"),
    "labour_complications": ("labour pain heavy bleeding", "baby coming early",
                             "obstructed labour", "premature labour"),
    "child_emergency":  ("child unconscious", "child not breathing",
                         "baby blue lips", "baby seizure"),
    "severe_pain":      ("worst pain ever", "10 out of 10 pain",
                         "unbearable pain"),
    "poisoning":        ("swallowed poison", "took poison", "ate something poisonous",
                         "overdose"),
    "head_injury":      ("hit head bleeding", "knocked unconscious", "head injury severe"),
}

HIGH_URGENCY_PATTERNS = {
    "high_fever":      ("very high fever", "fever 39", "fever 40", "fever 41",
                        "burning up", "high temperature"),
    "persistent_vomit": ("vomiting all day", "cant keep water down",
                         "cannot keep food down", "vomiting blood"),
    "severe_abdo":     ("severe stomach pain", "very bad abdominal pain",
                        "appendicitis"),
    "dehydration":     ("dehydrated", "no urine", "dry mouth weak",
                        "sunken eyes"),
    "severe_headache": ("worst headache", "thunderclap headache",
                        "severe headache with vomiting"),
    "blood_in_stool":  ("blood in stool", "bloody diarrhoea", "bloody diarrhea"),
    "blood_in_urine":  ("blood in urine",),
    "pregnancy_concerning": ("pregnant bleeding", "pregnancy headache severe",
                             "swelling in pregnancy", "no baby movement"),
    "malaria_severe":  ("malaria with confusion", "malaria with seizure",
                        "severe malaria", "yellow eyes fever"),
    "sickle_crisis":   ("sickle cell crisis", "sickle pain severe"),
    "cholera_suspected": ("watery diarrhoea many times", "rice water stool",
                         "watery diarrhea many times"),
}

MODERATE_PATTERNS = {
    "fever":           ("fever", "high temperature", "feeling hot"),
    "malaria_typical": ("malaria", "chills shivering fever",
                        "fever headache body pain"),
    "cough_persistent": ("cough for weeks", "persistent cough", "cough with blood"),
    "diarrhoea":       ("diarrhoea", "diarrhea", "loose stools", "running stomach"),
    "infection":       ("infected wound", "pus", "swollen red area"),
    "moderate_pain":   ("stomach ache", "headache", "body pain", "joint pain"),
    "rash":            ("rash spreading", "itchy rash", "skin rash"),
    "vomit":           ("vomiting", "nausea", "throwing up"),
    "earache":         ("ear pain", "ear infection", "earache"),
    "uti":             ("burning when urinating", "uti", "urinary infection"),
    "menstrual_severe": ("very painful period", "heavy period"),
}

LOW_PATTERNS = {
    "cold":            ("running nose", "blocked nose", "cold", "sneezing"),
    "minor_headache":  ("mild headache", "small headache"),
    "minor_injury":    ("small cut", "scrape", "bruise", "minor injury"),
    "general":         ("checkup", "general consultation", "feeling unwell mildly",
                        "tired", "stressed"),
    "refill":          ("prescription refill", "buy medicine", "drug refill"),
}

@dataclass
class TriageResult:
    urgency:        Urgency
    matched:        List[str]              # rule IDs that fired
    facility_types: List[str]              # ranked types
    plain_summary:  str
    immediate_action: str
    safety_notes:   List[str]


def _normalize(text: str) -> str:
    t = text.lower().strip()
    # collapse whitespace
    t = re.sub(r"\s+", " ", t)
    # remove punctuation that doesn't help matching
    t = re.sub(r"[?!.,;:]", " ", t)
    return t


def _match(patterns: dict, text: str) -> Set[str]:
    matched: Set[str] = set()
    for rule_id, phrases in patterns.items():
        for p in phrases:
            if p in text:
                matched.add(rule_id)
                break
    return matched


def triage(symptoms_text: str) -> TriageResult:
    """Map free-text symptoms to urgency + recommended facility tier."""
    text = _normalize(symptoms_text)

    emerg = _match(EMERGENCY_PATTERNS, text)
    high  = _match(HIGH_URGENCY_PATTERNS, text)
    mod   = _match(MODERATE_PATTERNS, text)
    low   = _match(LOW_PATTERNS, text)

    if emerg:
        return TriageResult(
            urgency="emergency",
            matched=sorted(emerg),
            facility_types=["hospital"],
            plain_summary=(
                "Your symptoms suggest a medical emergency. Get to a "
                "hospital straight away — do not wait."),
            immediate_action=(
                "1) Call the National Ambulance Service on 112 or 193 now.\n"
                "2) Do not eat or drink anything.\n"
                "3) Stay with the person; keep them sitting upright or in the "
                "recovery position if unconscious.\n"
                "4) Have ID, allergies, and medication list ready when help arrives."),
            safety_notes=[
                "If breathing stops, start CPR if you know how.",
                "If you are alone and able, drive directly to the nearest "
                "hospital A&E.",
            ],
        )

    if high:
        return TriageResult(
            urgency="high",
            matched=sorted(high),
            facility_types=["hospital", "clinic"],
            plain_summary=(
                "Your symptoms are concerning and need same-day medical "
                "attention. Visit a hospital or clinic today."),
            immediate_action=(
                "1) Travel to the nearest hospital or clinic today, not tomorrow.\n"
                "2) Drink water in small sips if you can tolerate it.\n"
                "3) Take note of when symptoms started — staff will ask."),
            safety_notes=[
                "If symptoms worsen (confusion, fainting, severe bleeding, "
                "difficulty breathing) escalate to emergency immediately.",
            ],
        )

    if mod:
        return TriageResult(
            urgency="moderate",
            matched=sorted(mod),
            facility_types=["clinic", "health_post", "doctors"],
            plain_summary=(
                "Your symptoms warrant medical assessment soon. A clinic "
                "or health centre is appropriate."),
            immediate_action=(
                "1) Schedule a clinic visit within 24-48 hours.\n"
                "2) Rest, stay hydrated, and monitor your temperature.\n"
                "3) Note any new symptoms that appear."),
            safety_notes=[
                "If you develop high fever (above 39 C), severe pain, "
                "bleeding, or confusion, go to the hospital immediately.",
            ],
        )

    if low:
        return TriageResult(
            urgency="low",
            matched=sorted(low),
            facility_types=["pharmacy", "clinic", "health_post"],
            plain_summary=(
                "Your symptoms appear mild. Self-care or a pharmacy "
                "consultation should be enough."),
            immediate_action=(
                "1) Rest and drink plenty of fluids.\n"
                "2) Visit a nearby pharmacy for over-the-counter relief.\n"
                "3) If symptoms persist beyond 3-5 days, visit a clinic."),
            safety_notes=[
                "Mild symptoms can sometimes mask serious illness. "
                "Re-assess after 48 hours.",
            ],
        )

    # Unknown — default to moderate / clinic
    return TriageResult(
        urgency="moderate",
        matched=[],
        facility_types=["clinic"],
        plain_summary=(
            "I couldn't classify the symptoms confidently. To be safe, "
            "please visit a clinic for an in-person assessment."),
        immediate_action=(
            "1) Visit your nearest clinic.\n"
            "2) Bring a list of symptoms with start times.\n"
            "3) If anything worsens suddenly, escalate to a hospital."),
        safety_notes=[
            "This tool is not a diagnosis. Always defer to a qualified "
            "clinician.",
        ],
    )
