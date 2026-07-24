export type ServicePrecautionDefault = {
  title: string;
  intro: string;
  instructions: string;
  contact: string;
};

export const servicePrecautionDefaults: Record<string, ServicePrecautionDefault> = {
  "consultation": {
    title: "Consultation",
    intro: "Please help us assess the safest and most suitable service for you.",
    instructions: [
      "Complete all health, allergy, medication, pregnancy and previous-treatment questions honestly.",
      "Bring reference photos and details of any previous permanent makeup, removal work or recent cosmetic treatment.",
      "Treatment is not guaranteed on the consultation day unless it was separately booked and all safety requirements are met.",
    ].join("\n"),
    contact: "Tell us before attending if you have an active rash, infection, wound, illness or recent procedure near the treatment area.",
  },
  "brow lamination": {
    title: "Brow Lamination",
    intro: "Prepare your brows so the lifting products can be used safely and evenly.",
    instructions: [
      "Complete the required patch test 24-48 hours before your appointment.",
      "Avoid waxing, threading, strong exfoliation and chemical peels around the brows for 5-7 days.",
      "Arrive with clean, dry brows and no brow makeup, oil, heavy moisturiser or self-tan.",
    ].join("\n"),
    contact: "Postpone for redness, rash, cuts, infection, sunburn, a positive patch test or very weak/overprocessed brow hair.",
  },
  "lash lift": {
    title: "Lash Lift",
    intro: "The service uses lifting products close to the eyes, so the eye area must be healthy and product-free.",
    instructions: [
      "Complete the required patch test 24-48 hours before the appointment.",
      "Arrive without mascara, eyeliner, eyeshadow, eye cream or oily products.",
      "Remove contact lenses before treatment and bring glasses. Arrange professional removal of lash extensions beforehand.",
    ].join("\n"),
    contact: "Contact us for a stye, eye infection, eyelid inflammation, severe dry/watery eyes, recent eye surgery, weak lashes or any patch-test reaction.",
  },
  "lip blush": {
    title: "Lip Blush",
    intro: "Lip blush is a cosmetic tattoo procedure and must only be performed on healthy, unbroken lips.",
    instructions: [
      "Tell us about any cold-sore/HSV history, recent lip filler, dental work, medication or previous lip tattoo.",
      "Avoid alcohol and excessive caffeine for 24 hours. Eat normally, stay hydrated and arrive with clean lips.",
      "Do not stop prescribed blood-thinning or other medication without approval from the prescribing clinician.",
    ].join("\n"),
    contact: "Postpone for cold-sore tingling or blisters, cracked/bleeding lips, infection, rash, severe dryness, open wounds or sunburn.",
  },
  "nano brows": {
    title: "Nano Brows",
    intro: "Nano brows are permanent makeup, so the brow skin must be calm, healthy and properly prepared.",
    instructions: [
      "Avoid waxing, threading, tinting and strong exfoliation around the brows for 5-7 days.",
      "Avoid alcohol and excessive caffeine for 24-48 hours. Arrive fed, hydrated and with clean brows.",
      "Disclose previous permanent makeup/removal, prescription retinoids or isotretinoin, and any bleeding or healing condition.",
    ].join("\n"),
    contact: "Postpone for active acne, rash, eczema/dermatitis flare, infection, wounds, swelling, sunburn or unhealed previous brow work.",
  },
  "ombre brows": {
    title: "Ombre Brows",
    intro: "Ombre brows are permanent makeup and require healthy skin plus careful preparation before pigment is implanted.",
    instructions: [
      "Avoid waxing, threading, tinting, strong exfoliation and harsh brow products for 5-7 days.",
      "Avoid alcohol and excessive caffeine for 24-48 hours. Arrive fed, hydrated and without brow makeup, oil or self-tan.",
      "Disclose previous permanent makeup/removal, recent injections, peel, laser, surgery and medicines that may affect bleeding or healing.",
    ].join("\n"),
    contact: "Postpone for infection, rash, open wounds, severe acne, swelling, sunburn, unhealed brow work or a recent procedure that has not been cleared.",
  },
};
