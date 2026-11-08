export type CatalogTopic = { title: string; description: string };
export type CatalogModule = { kind: "THEORY" | "PRACTICAL"; title: string; summary: string; topics: CatalogTopic[] };
export type CatalogFaq = { question: string; answer: string };

export type CatalogCourse = {
  id: string;
  code: string;
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  skillLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  prerequisites: string;
  objectives: string[];
  durationLabel: string;
  materials: string[];
  safety: string[];
  outcomes: string[];
  theory: CatalogModule[];
  practical: CatalogModule[];
  faqs: CatalogFaq[];
  featured: boolean;
  displayOrder: number;
  serviceSlug: string;
};

const registrationAnswer =
  "Submit the registration request for this course. Viola reviews it before any fee, seat, or start date is confirmed. Course fees and timetables are not published until the studio approves them.";

function theory(title: string, summary: string, topics: Array<[string, string]>): CatalogModule {
  return { kind: "THEORY", title, summary, topics: topics.map(([topicTitle, description]) => ({ title: topicTitle, description })) };
}

function practical(title: string, summary: string, topics: Array<[string, string]>): CatalogModule {
  return { kind: "PRACTICAL", title, summary, topics: topics.map(([topicTitle, description]) => ({ title: topicTitle, description })) };
}

export const courseCatalog: CatalogCourse[] = [
  {
    id: "course-nano-brows",
    code: "NB-01",
    name: "Nano Brows",
    slug: "nano-brows",
    category: "Brow Treatments",
    shortDescription: "Hair-stroke brow training covering mapping, machine control, pigment choice, and healed-looking strokes.",
    fullDescription: "This course introduces nano brow work as a machine hair-stroke service. Students study brow design, skin, pigment, and stroke direction, then practice the sequence used in a supervised studio session. The draft curriculum is editable by Viola and does not publish a fee or start date.",
    skillLevel: "INTERMEDIATE",
    prerequisites: "Comfort with close-up hand work and a steady seated posture. Previous permanent-makeup experience is helpful and is not required for the introductory draft.",
    objectives: ["Map brows that follow the client’s bone structure and facial balance.", "Build single-stroke patterns with consistent depth and direction.", "Choose and explain pigment and aftercare in plain language."],
    durationLabel: "Timetable shared at registration",
    materials: ["Mapping tools and disposable measuring supplies", "Practice skin and machine setup", "Pigment study set", "Studio sanitation supplies"],
    safety: ["Review contraindications before any skin practice.", "Keep needle cartridges sealed until the practical station is prepared.", "Stop if the skin shows unexpected reaction and ask the trainer."],
    outcomes: ["Explain the difference between a hair stroke and a shaded brow.", "Complete a mapped brow design and a supervised stroke pattern.", "Describe immediate and healed aftercare without promising a medical result."],
    theory: [
      theory("Brow design and skin", "Read the face before drawing a hair pattern.", [
        ["Facial balance", "Study brow start, arch, and tail against the client’s features."],
        ["Skin and hair direction", "Read skin thickness and natural hair flow before choosing stroke direction."],
        ["Consultation questions", "Cover health history, previous permanent makeup, and expectations."],
      ]),
      theory("Pigment and healing", "Understand why a fresh stroke is not the healed result.", [
        ["Color choice", "Compare warm and cool pigments on different skin tones."],
        ["Healing stages", "Explain scabbing, fading, and when a follow-up is discussed."],
      ]),
    ],
    practical: [
      practical("Mapping lab", "Draw and correct a full brow map.", [
        ["Symmetry check", "Measure, photograph the map, and adjust before pigment."],
        ["Stroke pattern", "Plan head, body, and tail strokes so they do not cross into a solid patch."],
      ]),
      practical("Machine practice", "Practice pressure, speed, and passes on practice skin.", [
        ["Needle and machine setup", "Assemble, test, and dispose of the cartridge safely."],
        ["Stroke sequence", "Place strokes in sections and stretch the skin consistently."],
      ]),
    ],
    faqs: [
      { question: "Is a fee shown for Nano Brows training?", answer: "Not until Viola publishes an approved fee. The registration form does not charge you." },
      { question: "How do I request a place?", answer: registrationAnswer },
    ],
    featured: true,
    displayOrder: 1,
    serviceSlug: "nano-brows",
  },
  {
    id: "course-ombre-brows",
    code: "OB-02",
    name: "Ombré Brows",
    slug: "ombre-brows",
    category: "Brow Treatments",
    shortDescription: "Machine shading that builds a softer front and a deeper tail, with mapping and color control.",
    fullDescription: "Ombré brow training focuses on pixel shading rather than hair strokes. Students learn how to keep the front of the brow lighter, build density through the body and tail, and judge when to stop a pass. Fees and dates stay unpublished until Viola approves them.",
    skillLevel: "INTERMEDIATE",
    prerequisites: "Steady machine handling is helpful. The draft still starts with mapping and skin theory for students who are new to shading.",
    objectives: ["Map an ombré brow with a soft front and defined tail.", "Control shade density pass by pass.", "Explain healing color so clients are not surprised by the fresh result."],
    durationLabel: "Timetable shared at registration",
    materials: ["Shading practice skin", "Mapping pencil and pigment cups", "Machine and sealed cartridges", "Barrier film and waste containers"],
    safety: ["Confirm the service is appropriate before shading.", "Limit work near broken or irritated skin.", "Record pigment used during practice."],
    outcomes: ["Produce a gradient from the head to the tail on practice skin.", "Describe saturation without overworking one area.", "Give clear aftercare for a shaded brow."],
    theory: [
      theory("Ombré design", "Plan the gradient before the machine is switched on.", [
        ["Front softness", "Keep the head lighter so the brow does not start as a block."],
        ["Tail density", "Build the body and tail in even sections."],
      ]),
      theory("Color and retention", "Study how shade heals compared with a hair stroke.", [
        ["Pigment layers", "Understand why extra passes are not always more retention."],
        ["Client explanation", "Describe fresh, peeling, and settled color in everyday words."],
      ]),
    ],
    practical: [
      practical("Shade building", "Practice a controlled gradient.", [
        ["Section shading", "Work the brow in sections with consistent stretch."],
        ["Pixel spacing", "Leave enough space that the front does not fill solid."],
      ]),
      practical("Finish and review", "Check the result as a trainer would.", [
        ["Symmetry review", "Compare both brows in a photograph before more pigment."],
        ["Cleanup", "Remove pigment from the surrounding skin without disturbing the shade."],
      ]),
    ],
    faqs: [
      { question: "Is this the same as nano brows?", answer: "No. Ombré brows are a shaded gradient. Nano brows are hair strokes. Viola also offers a combo course for both." },
      { question: "How do I request a place?", answer: registrationAnswer },
    ],
    featured: true,
    displayOrder: 2,
    serviceSlug: "ombre-brows",
  },
  {
    id: "course-combo-brows",
    code: "CB-03",
    name: "Combo Brows",
    slug: "combo-brows",
    category: "Brow Treatments",
    shortDescription: "Combine hair strokes through the front with shading through the body and tail.",
    fullDescription: "Combo brow training joins two patterns in one brow: strokes where hair detail is wanted, and shade where more definition is needed. Students learn the transition between those patterns so the brow does not look like two unfinished services. This is a draft syllabus with no published fee or date.",
    skillLevel: "ADVANCED",
    prerequisites: "Prior practice in hair strokes or shading is recommended because the course concentrates on combining both.",
    objectives: ["Choose where strokes stop and shade begins.", "Keep the transition soft.", "Plan a combo brow for different hair density."],
    durationLabel: "Timetable shared at registration",
    materials: ["Stroke and shade practice skin", "Mapping kit", "Two cartridge setups", "Pigment record sheet"],
    safety: ["Do not stack unlimited passes over the same stroke.", "Treat the transition zone with less pressure.", "Follow the same consultation checks as other machine brow work."],
    outcomes: ["Map a combo brow with a marked transition.", "Complete both patterns on practice skin.", "Explain who a combo brow may suit, without promising a healed outcome."],
    theory: [
      theory("When to combine", "Decide the pattern from the client’s hair, not from a template alone.", [
        ["Sparse fronts", "Use strokes where natural hair is missing."],
        ["Defined tails", "Use shade where a cleaner outline is requested."],
      ]),
    ],
    practical: [
      practical("Transition lab", "Join the two patterns.", [
        ["Mark the blend zone", "Draw the point where strokes fade into shade."],
        ["Pressure change", "Lighten the hand as shade meets the last strokes."],
      ]),
    ],
    faqs: [
      { question: "Should I take nano or ombré first?", answer: "Combo training is easier after you have practiced strokes or shading. Ask Viola which starting course fits you when you register." },
      { question: "How do I request a place?", answer: registrationAnswer },
    ],
    featured: false,
    displayOrder: 3,
    serviceSlug: "combo-brows",
  },
  {
    id: "course-lip-blushing",
    code: "LB-04",
    name: "Lip Blushing",
    slug: "lip-blushing",
    category: "Lip Treatments",
    shortDescription: "Lip color and shape training with mapping, layers, and honest healing guidance.",
    fullDescription: "Lip blushing training covers lip shape, color selection, and a layered machine technique for a soft tint. Students also study swelling and healing so they can explain the fresh result clearly. No fee or class date is published in this draft.",
    skillLevel: "INTERMEDIATE",
    prerequisites: "Students should be comfortable working close to the mouth and following strict hygiene steps.",
    objectives: ["Map lip shape within the natural border unless a change is specifically planned.", "Select a lip color from undertone, not from a photograph alone.", "Describe swelling and aftercare."],
    durationLabel: "Timetable shared at registration",
    materials: ["Lip mapping tools", "Practice lips or skin", "Color study pigments", "Disposable barriers"],
    safety: ["Screen for active cold sores and other contraindications before practice on a person.", "Keep pigment off broken skin.", "Use a fresh cartridge for each practice partner."],
    outcomes: ["Complete a lip map and a layered color pass on practice material.", "Explain why healed lip color is softer than the fresh color.", "List aftercare the client must follow."],
    theory: [
      theory("Lip color theory", "Read undertones before choosing pigment.", [
        ["Warm and cool lips", "Compare how the same pigment shifts on different undertones."],
        ["Shape and symmetry", "Map cupid’s bow, peaks, and corners."],
      ]),
    ],
    practical: [
      practical("Layering lab", "Build color without outlining too harshly.", [
        ["Outline decision", "Decide whether a defined line is appropriate."],
        ["Even passes", "Cover both lips with consistent stretch and speed."],
      ]),
    ],
    faqs: [
      { question: "Does lip blushing correct very dark lips?", answer: "Dark-lip correction is covered in Lip Neutralization. Lip blushing is the softer color service." },
      { question: "How do I request a place?", answer: registrationAnswer },
    ],
    featured: true,
    displayOrder: 4,
    serviceSlug: "lip-blushing",
  },
  {
    id: "course-lip-neutralization",
    code: "LN-05",
    name: "Lip Neutralization",
    slug: "lip-neutralization",
    category: "Lip Treatments",
    shortDescription: "Color-correction training for dark or cool lips, taught as a staged process rather than one guaranteed visit.",
    fullDescription: "Lip neutralization studies how to balance dark or cool lip tones before a desired blush color can show. The course treats correction as a staged process and does not promise a finished color in one session. Fees and dates remain unpublished until approved.",
    skillLevel: "ADVANCED",
    prerequisites: "Lip blushing practice, or equivalent studio experience, is recommended.",
    objectives: ["Identify undertones that need neutralization.", "Plan more than one stage when a single pass cannot balance the lip.", "Explain limits clearly to a client."],
    durationLabel: "Timetable shared at registration",
    materials: ["Corrector and target pigments", "Practice material", "Consultation forms", "Photography notes for before-and-after teaching pairs"],
    safety: ["Do not practice correction on irritated lips.", "Avoid claiming a medical or permanent guarantee.", "Record each stage so the next session has a reference."],
    outcomes: ["Build a correction plan with a target color and a stopping point.", "Apply a controlled neutralizer pass on practice material.", "Explain why a follow-up may be required."],
    theory: [
      theory("Undertones", "See the color that has to be balanced first.", [
        ["Dark and cool lips", "Separate melanin, previous pigment, and natural coolness."],
        ["Staged plans", "Write a two-stage plan instead of forcing one appointment."],
      ]),
    ],
    practical: [
      practical("Correction lab", "Place neutralizer evenly.", [
        ["Test spots", "Judge a small area before covering the full lip."],
        ["Target color", "Discuss the blush color only after the correction stage."],
      ]),
    ],
    faqs: [
      { question: "Will one class make me able to correct every lip?", answer: "No. The course teaches a method and its limits. Difficult cases still need trainer review." },
      { question: "How do I request a place?", answer: registrationAnswer },
    ],
    featured: false,
    displayOrder: 5,
    serviceSlug: "lip-neutralization",
  },
  {
    id: "course-permanent-eyeliner",
    code: "PE-06",
    name: "Eyeliner",
    slug: "permanent-eyeliner",
    category: "Eyes",
    shortDescription: "Eyeliner mapping and machine work with extra attention to eye safety and lash-line control.",
    fullDescription: "Permanent eyeliner training covers classic and softly enhanced liner styles, eye mapping, and the hygiene required so close to the eye. Students practice stretch, depth, and symmetry on practice material before any supervised model work Viola schedules. No fee or date is published here.",
    skillLevel: "ADVANCED",
    prerequisites: "Machine experience is strongly recommended. Students must be able to follow eye-area safety rules without shortcuts.",
    objectives: ["Map a liner that follows the lash line.", "Keep pigment out of the wet margin unless a style explicitly calls for a different plan.", "Work evenly on both eyes."],
    durationLabel: "Timetable shared at registration",
    materials: ["Eye mapping tools", "Practice skin", "Dark pigment set", "Eye-area hygiene kit"],
    safety: ["Stop for infection, swelling, or a client who cannot keep the eye still.", "Protect the eye throughout the practical.", "Never reuse a cartridge."],
    outcomes: ["Map and execute a controlled liner on practice material.", "List eye-area contraindications.", "Give aftercare that protects the eye while the liner settles."],
    theory: [
      theory("Eye anatomy for artists", "Know the structures you must avoid.", [
        ["Lash line", "Identify where pigment belongs for the planned style."],
        ["Styles", "Compare a lash enhancement with a wider liner."],
      ]),
    ],
    practical: [
      practical("Liner lab", "Practice a steady line.", [
        ["Stretch", "Hold the lid so the line does not skip."],
        ["Both eyes", "Match thickness and length from the photograph."],
      ]),
    ],
    faqs: [
      { question: "Is this a lash-extension course?", answer: "No. This course is machine eyeliner. Eyelash extensions have a separate course." },
      { question: "How do I request a place?", answer: registrationAnswer },
    ],
    featured: false,
    displayOrder: 6,
    serviceSlug: "permanent-eyeliner",
  },
  {
    id: "course-eyebrow-lamination",
    code: "EL-07",
    name: "Eyebrow Lamination",
    slug: "eyebrow-lamination",
    category: "Brow Treatments",
    shortDescription: "Brow lifting and setting, including patch-test rules, timing, and shaping.",
    fullDescription: "Eyebrow lamination training teaches how to lift and set brow hair, then shape the result. Timing, product placement, and patch testing are treated as required steps, not optional extras. The syllabus is a draft and does not publish a price or start date.",
    skillLevel: "BEGINNER",
    prerequisites: "No permanent-makeup experience is required. Students must follow timing and patch-test instructions exactly.",
    objectives: ["Explain what lamination does to the hair.", "Time each product step.", "Shape the brow after the lift without over-removing hair."],
    durationLabel: "Timetable shared at registration",
    materials: ["Lamination practice brows or mannequin", "Timing cards", "Spoolies and mapping pencil", "Patch-test notes"],
    safety: ["Do not laminate over broken, sunburned, or irritated skin.", "Respect processing times.", "Keep product out of the eye."],
    outcomes: ["Complete a timed lamination sequence on practice material.", "Describe a patch test and when to postpone.", "Shape and finish a lifted brow."],
    theory: [
      theory("Hair and timing", "The result depends on the clock as much as the brush.", [
        ["Hair structure", "Understand what the lifting product changes."],
        ["Patch testing", "Know when a client should be postponed."],
      ]),
    ],
    practical: [
      practical("Lamination sequence", "Practice the full order.", [
        ["Lift and set", "Apply, time, and remove each step cleanly."],
        ["Shape", "Trim and tidy only after the hair is set."],
      ]),
    ],
    faqs: [
      { question: "Is lamination the same as henna?", answer: "No. Lamination lifts the hair. Henna stains the hair and skin. Viola teaches them as separate courses." },
      { question: "How do I request a place?", answer: registrationAnswer },
    ],
    featured: false,
    displayOrder: 7,
    serviceSlug: "eyebrow-lamination",
  },
  {
    id: "course-eyebrow-henna",
    code: "EH-08",
    name: "Eyebrow Henna",
    slug: "eyebrow-henna",
    category: "Brow Treatments",
    shortDescription: "Brow staining and shape design, with mixing, skin tests, and stain-versus-dye basics.",
    fullDescription: "Eyebrow henna training covers shape design, mixing, and how a stain sits on hair and skin. Students learn to keep the stain inside the mapped shape and to explain that a skin stain fades sooner than the hair stain. No fee or date is published in this draft.",
    skillLevel: "BEGINNER",
    prerequisites: "No machine experience is required. A careful hand for mapping is important.",
    objectives: ["Map a brow shape before mixing stain.", "Mix and time henna consistently.", "Explain fade on skin versus hair."],
    durationLabel: "Timetable shared at registration",
    materials: ["Henna mixing set", "Mapping pencil", "Practice skin or model brows scheduled by the studio", "Barrier cream"],
    safety: ["Patch test as the studio requires.", "Keep stain out of the eye.", "Do not apply over broken skin."],
    outcomes: ["Map and fill a henna brow on practice material.", "Time the stain and remove it cleanly.", "Describe aftercare for the first day."],
    theory: [
      theory("Stain behavior", "Set expectations before the mix is applied.", [
        ["Skin stain and hair stain", "Explain why they fade at different speeds."],
        ["Shape first", "Design the brow before product touches the skin."],
      ]),
    ],
    practical: [
      practical("Mixing and application", "Practice an even stain.", [
        ["Mix consistency", "Prepare a mix that stays where it is placed."],
        ["Clean edges", "Remove residue without smearing the map."],
      ]),
    ],
    faqs: [
      { question: "How long does the stain last?", answer: "Viola will teach typical fade patterns in class. This page does not publish a guaranteed wear time." },
      { question: "How do I request a place?", answer: registrationAnswer },
    ],
    featured: false,
    displayOrder: 8,
    serviceSlug: "eyebrow-henna",
  },
  {
    id: "course-makeup-artistry",
    code: "MU-09",
    name: "Makeup",
    slug: "makeup-artistry",
    category: "Makeup",
    shortDescription: "Skin preparation, complexion, eyes, and event makeup with sanitation between clients.",
    fullDescription: "Makeup artistry training builds a working order for preparing skin, correcting and covering where needed, and finishing eyes and lips for daytime or event makeup. Hygiene between clients is part of the method. Fees and class dates are not published until Viola approves them.",
    skillLevel: "BEGINNER",
    prerequisites: "No permanent-makeup experience is required.",
    objectives: ["Prepare skin before color.", "Build a complexion that still looks like skin.", "Complete an eye and lip look that matches the occasion."],
    durationLabel: "Timetable shared at registration",
    materials: ["Sanitized brush kit", "Complexion and color products for practice", "Disposable applicators", "Reference faces for proportion study"],
    safety: ["Do not share eye or lip products that cannot be sanitized.", "Patch-test products when the studio requires it.", "Stop if the skin is broken or reacting."],
    outcomes: ["Complete a full makeup in a set order.", "Sanitize tools between clients.", "Adjust a look for daytime and for an event without a new product list every time."],
    theory: [
      theory("Proportion and color", "Plan the face before opening every product.", [
        ["Skin finish", "Choose coverage from the skin in front of you."],
        ["Color placement", "Place eyes, cheeks, and lips so they agree."],
      ]),
    ],
    practical: [
      practical("Full-face lab", "Work in one repeatable order.", [
        ["Complexion", "Prepare, cover, and set without a heavy mask."],
        ["Eyes and lips", "Finish a look and photograph it for critique."],
      ]),
    ],
    faqs: [
      { question: "Is this a bridal-only course?", answer: "Event makeup is included. The course also covers a clean daytime finish." },
      { question: "How do I request a place?", answer: registrationAnswer },
    ],
    featured: true,
    displayOrder: 9,
    serviceSlug: "makeup",
  },
  {
    id: "course-eyelash-extensions",
    code: "EE-10",
    name: "Eyelash Extensions",
    slug: "eyelash-extensions",
    category: "Lashes",
    shortDescription: "Classic isolation, adhesive safety, and lash mapping for a clean extension set.",
    fullDescription: "Eyelash extension training starts with isolation and adhesive safety, then mapping and placement for a classic set. Students learn removal and aftercare so a set can be maintained without damaging natural lashes. This draft does not publish a fee or start date.",
    skillLevel: "INTERMEDIATE",
    prerequisites: "Patience for close work is essential. Previous lash experience is helpful and is not assumed.",
    objectives: ["Isolate one natural lash at a time.", "Place adhesive without sticking neighboring lashes.", "Map lengths so the set follows the eye."],
    durationLabel: "Timetable shared at registration",
    materials: ["Mannequin or practice strips", "Tweezers", "Classic lashes and adhesive for training", "Eye pads and tape"],
    safety: ["Work in a ventilated station.", "Keep adhesive off skin and out of the eye.", "Do not apply over infection or severely irritated eyes."],
    outcomes: ["Complete an isolated classic practice set.", "Remove extensions with the studio method.", "Explain fill timing and home care."],
    theory: [
      theory("Lash safety", "Adhesive and isolation come before styling.", [
        ["Natural lash health", "Know when not to apply a set."],
        ["Adhesive handling", "Store, dispense, and dispose of adhesive as directed."],
      ]),
    ],
    practical: [
      practical("Classic set", "Build a set one lash at a time.", [
        ["Isolation", "Separate a single natural lash before picking up an extension."],
        ["Mapping", "Place lengths so both eyes match."],
      ]),
    ],
    faqs: [
      { question: "Does this include a lash lift?", answer: "No. Lash lift remains a separate studio service. This course is eyelash extensions." },
      { question: "How do I request a place?", answer: registrationAnswer },
    ],
    featured: false,
    displayOrder: 10,
    serviceSlug: "eyelash-extensions",
  },
  {
    id: "course-nail-technology",
    code: "NL-11",
    name: "Nail",
    slug: "nail-technology",
    category: "Nails",
    shortDescription: "Manicure preparation, product control, and safe removal for natural-nail services.",
    fullDescription: "Nail technology training covers nail anatomy, sanitation, manicure preparation, and controlled product application and removal. The emphasis is a tidy natural-nail service rather than a single fashion trend. Fees and dates stay hidden until Viola publishes them.",
    skillLevel: "BEGINNER",
    prerequisites: "No previous nail qualification is required for this draft.",
    objectives: ["Prepare the nail without damaging the nail plate.", "Apply product evenly.", "Remove product by the method that matches what was applied."],
    durationLabel: "Timetable shared at registration",
    materials: ["Practice hands", "Sanitation setup", "Files and buffers", "Training color and removal products"],
    safety: ["Do not share files between clients.", "Stop if the skin around the nail is infected or open.", "Keep dust and liquids controlled at the desk."],
    outcomes: ["Complete a sanitary manicure preparation.", "Apply and finish a practice color.", "Remove the product without scraping the nail plate bare."],
    theory: [
      theory("Nail anatomy", "Know the structures you are filing around.", [
        ["Nail plate and skin", "Identify the areas that should not be cut or over-filed."],
        ["Product types", "Match removal to the product used."],
      ]),
    ],
    practical: [
      practical("Manicure lab", "Work cleanly from one hand to the next.", [
        ["Preparation", "Push, tidy, and dust without cutting live skin."],
        ["Finish", "Apply an even color and clean the margin."],
      ]),
    ],
    faqs: [
      { question: "Are acrylic extensions included?", answer: "This draft focuses on natural-nail preparation, color, and removal. Ask Viola if a later intake adds extensions." },
      { question: "How do I request a place?", answer: registrationAnswer },
    ],
    featured: false,
    displayOrder: 11,
    serviceSlug: "nails",
  },
  {
    id: "course-professional-waxing",
    code: "WX-12",
    name: "Wax",
    slug: "professional-waxing",
    category: "Waxing",
    shortDescription: "Hygiene, contraindications, and hard- and soft-wax technique for common waxing services.",
    fullDescription: "Professional waxing training covers consultation, contraindications, hygiene, and the difference between hard and soft wax. Students practice sectioning and removal direction on appropriate practice material before any model work the studio arranges. No fee or start date is published in this draft.",
    skillLevel: "BEGINNER",
    prerequisites: "No permanent-makeup experience is required. Students must be willing to follow hygiene rules strictly.",
    objectives: ["Screen a client before waxing.", "Choose hard or soft wax for the area.", "Remove wax in the correct direction with skin support."],
    durationLabel: "Timetable shared at registration",
    materials: ["Wax pots for training", "Spatulas and strips", "Practice material", "Pre- and aftercare products"],
    safety: ["Do not wax broken, sunburned, or irritated skin.", "Never double-dip a spatula.", "Check product temperature before it nears skin."],
    outcomes: ["Complete a consultation checklist.", "Perform a controlled wax section on practice material.", "Explain aftercare for the first day."],
    theory: [
      theory("When not to wax", "The consultation is part of the service.", [
        ["Contraindications", "Recognize skin and health reasons to postpone."],
        ["Hard and soft wax", "Choose the wax from the area and hair type."],
      ]),
    ],
    practical: [
      practical("Waxing lab", "Practice temperature, application, and removal.", [
        ["Sectioning", "Apply a thin, even patch."],
        ["Removal", "Support the skin and remove in the planned direction."],
      ]),
    ],
    faqs: [
      { question: "Which body areas are included?", answer: "The studio confirms the areas taught in each intake. This page does not promise every body area." },
      { question: "How do I request a place?", answer: registrationAnswer },
    ],
    featured: false,
    displayOrder: 12,
    serviceSlug: "waxing",
  },
];

export const registrationInformation =
  "Registration is a request. It does not confirm a seat, a fee, or a start date. Viola reviews the request, then records any fee and payment separately. You can add an optional intake name, such as Oct 23 Batch, if the studio has given you one.";
