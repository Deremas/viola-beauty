export type ServiceFaq = { question: string; answer: string };

export type ServiceProfile = {
  slug: string;
  code: string;
  serviceId: string | null;
  name: string;
  category: string;
  summary: string;
  longDescription: string;
  benefits: string[];
  preparation: string[];
  aftercare: string[];
  faqs: ServiceFaq[];
  featured: boolean;
  displayOrder: number;
  courseSlug: string;
  group: "brows" | "lips" | "eyes" | "beauty";
};

export const serviceProfiles: ServiceProfile[] = [
  {
    slug: "nano-brows",
    code: "SVC-NB",
    serviceId: "nano-brows",
    name: "Nano Brows",
    category: "Brow Treatments",
    summary:
      "Fine machine hair strokes that follow the direction of your brow hair.",
    longDescription:
      "Nano brows place fine, hair-like strokes through the brow. The studio maps the shape first, then builds strokes to suit your hair direction and skin. The fresh result softens as it heals, so the appointment includes aftercare rather than a promise of one exact healed color.",
    benefits: [
      "A mapped shape before pigment",
      "Hair-stroke detail through the brow",
      "Aftercare explained before you leave",
    ],
    preparation: [
      "Arrive with clean brows and no brow makeup.",
      "Tell the studio about previous permanent makeup, recent peels, or skin irritation.",
      "Follow any precaution notice shown during booking.",
    ],
    aftercare: [
      "Keep the brows dry for the period Viola gives you.",
      "Do not pick flakes.",
      "Contact the studio if the skin becomes unusually hot, swollen, or painful.",
    ],
    faqs: [
      {
        question: "Can I book nano brows online?",
        answer:
          "Yes, when the service is active in the booking system. Choose Book a service to see real available times.",
      },
      {
        question: "Is the healed color the same as the fresh color?",
        answer:
          "No. Fresh strokes look stronger and then soften. Viola explains that before treatment.",
      },
    ],
    featured: true,
    displayOrder: 1,
    courseSlug: "nano-brows",
    group: "brows",
  },
  {
    slug: "ombre-brows",
    code: "SVC-OB",
    serviceId: "ombre-brows",
    name: "Ombré Brows",
    category: "Brow Treatments",
    summary: "A shaded brow with a lighter front and a deeper tail.",
    longDescription:
      "Ombré brows use machine shading to create a soft front and a more defined body and tail. The shape is mapped before shading begins. Price and time on this page come from the live booking service when online booking is open.",
    benefits: [
      "Gradient from front to tail",
      "A defined shape without drawing every hair",
      "A booked time that is checked against the studio calendar",
    ],
    preparation: [
      "Come with clean, product-free brows.",
      "Share any previous brow tattoo or removal.",
      "Read the precaution notice for this service before you pay the advance.",
    ],
    aftercare: [
      "Follow the dry-heal or wash routine Viola gives you for your skin.",
      "Avoid brow makeup until the studio says it is appropriate.",
      "Use only the aftercare product the studio recommends.",
    ],
    faqs: [
      {
        question: "How is this different from nano brows?",
        answer:
          "Ombré brows are shaded. Nano brows are individual hair strokes.",
      },
      {
        question: "Where do I pay the advance?",
        answer:
          "The booking page shows the active bank accounts and asks for a transfer screenshot.",
      },
    ],
    featured: true,
    displayOrder: 2,
    courseSlug: "ombre-brows",
    group: "brows",
  },
  {
    slug: "combo-brows",
    code: "SVC-CB",
    serviceId: "combo-brows",
    name: "Combo Brows",
    category: "Brow Treatments",
    summary:
      "Hair strokes at the front with shading through the body and tail.",
    longDescription:
      "Combo brows mix two patterns: strokes where you want hair detail, and shade where you want more definition. Book a service opens the same calendar as the other appointments. Combo appears as its own choice after Viola saves its price and duration.",
    benefits: [
      "Strokes and shade in one shape",
      "A plan based on your natural hair",
      "The same payment-review booking flow as other services once it is published",
    ],
    preparation: [
      "Arrive with clean brows.",
      "Bring photos only as a reference, not as a guaranteed copy.",
      "Mention previous permanent makeup.",
    ],
    aftercare: [
      "Follow the combined stroke-and-shade aftercare Viola provides.",
      "Do not pick healing skin.",
      "Book any follow-up only when the studio offers it.",
    ],
    faqs: [
      {
        question: "Can I book combo brows online?",
        answer:
          "Choose Book a service to open the calendar. Combo is its own appointment after a real price and duration are saved.",
      },
    ],
    featured: false,
    displayOrder: 3,
    courseSlug: "combo-brows",
    group: "brows",
  },
  {
    slug: "lip-blushing",
    code: "SVC-LB",
    serviceId: "lip-blush",
    name: "Lip Blushing",
    category: "Lip Treatments",
    summary:
      "A soft lip tint and shape, booked under the studio’s existing lip service.",
    longDescription:
      "Lip blushing adds a soft tint and can tidy the lip shape. The existing booking record remains the live lip service, so its price, advance, and duration are unchanged. The name on this page is the studio’s public name for that service.",
    benefits: [
      "Color chosen for your lip tone",
      "Shape discussed before pigment",
      "Advance payment reviewed before the appointment is confirmed",
    ],
    preparation: [
      "Keep lips free of active cold sores or broken skin.",
      "Arrive without heavy lip product.",
      "Read the lip precaution notice during booking.",
    ],
    aftercare: [
      "Expect swelling at first.",
      "Follow the ointment and food guidance Viola gives you.",
      "Do not pick dry skin.",
    ],
    faqs: [
      {
        question: "Is the online price the live price?",
        answer:
          "Yes. When booking is open, the price and advance are the amounts stored on the booking service.",
      },
    ],
    featured: true,
    displayOrder: 4,
    courseSlug: "lip-blushing",
    group: "lips",
  },
  {
    slug: "lip-neutralization",
    code: "SVC-LN",
    serviceId: "lip-neutralization",
    name: "Lip Neutralization",
    category: "Lip Treatments",
    summary: "Color balancing for dark or cool lips before a target lip color.",
    longDescription:
      "Lip neutralization is a color-balancing service for lips that need correction before a blush tone can show. It may take more than one visit. It is not offered for online booking until Viola enters a price and duration.",
    benefits: [
      "A staged color plan",
      "Limits explained before you begin",
      "Separate from the lip blush booking until it is published",
    ],
    preparation: [
      "Do not book over an active cold sore.",
      "Tell the studio about previous lip pigment.",
      "Ask before paying if you are unsure this is the right lip service.",
    ],
    aftercare: [
      "Follow the same careful lip healing rules the studio gives you.",
      "Do not judge the correction on the first day.",
      "Wait for Viola’s follow-up advice.",
    ],
    faqs: [
      {
        question: "Can this be finished in one visit?",
        answer:
          "Not always. The studio will say if another visit is needed. This page does not promise a one-visit result.",
      },
    ],
    featured: false,
    displayOrder: 5,
    courseSlug: "lip-neutralization",
    group: "lips",
  },
  {
    slug: "permanent-eyeliner",
    code: "SVC-PE",
    serviceId: "permanent-eyeliner",
    name: "Eyeliner",
    category: "Eyes",
    summary:
      "Lash-line enhancement or a defined liner, planned around eye safety.",
    longDescription:
      "Permanent eyeliner enhances the lash line or creates a defined liner. Because the work is close to the eye, the studio screens the eye area first.",
    benefits: [
      "A style agreed before pigment",
      "Eye-area screening",
      "Aftercare aimed at keeping the eye comfortable",
    ],
    preparation: [
      "Remove contact lenses before treatment if Viola asks you to.",
      "Arrive without eye makeup.",
      "Postpone if you have an infection, stye, or irritated eye.",
    ],
    aftercare: [
      "Keep the area clean and dry as instructed.",
      "Do not use eyelash extensions or eye makeup until Viola allows it.",
      "Seek advice if the eye becomes painful or the vision changes.",
    ],
    faqs: [
      {
        question: "Is this an eyelash extension appointment?",
        answer: "No. Eyelash extensions are a separate service.",
      },
    ],
    featured: false,
    displayOrder: 6,
    courseSlug: "permanent-eyeliner",
    group: "eyes",
  },
  {
    slug: "eyebrow-lamination",
    code: "SVC-EL",
    serviceId: "brow-lamination",
    name: "Eyebrow Lamination",
    category: "Brow Treatments",
    summary:
      "A brow lift and shape using the studio’s existing lamination booking.",
    longDescription:
      "Eyebrow lamination lifts and sets the brow hair, then the shape is tidied. This page uses the live brow lamination service already in the booking system, including its current price and time.",
    benefits: [
      "Hair lifted in the direction of the map",
      "A tidy shape after the lift",
      "Patch-test guidance in the booking precautions",
    ],
    preparation: [
      "Complete any patch test the studio requires.",
      "Arrive with clean, dry brows.",
      "Avoid recent waxing or strong peels around the brows.",
    ],
    aftercare: [
      "Keep the brows dry for the first period Viola specifies.",
      "Brush them in the lifted direction.",
      "Postpone retouching if the skin is irritated.",
    ],
    faqs: [
      {
        question: "Does booking still use the current advance amount?",
        answer:
          "Yes. The booking page calculates the advance from the saved service, not from this description.",
      },
    ],
    featured: true,
    displayOrder: 7,
    courseSlug: "eyebrow-lamination",
    group: "brows",
  },
  {
    slug: "eyebrow-henna",
    code: "SVC-EH",
    serviceId: "eyebrow-henna",
    name: "Eyebrow Henna",
    category: "Brow Treatments",
    summary:
      "A stained brow shape on the hair and skin, mapped before the mix is applied.",
    longDescription:
      "Eyebrow henna stains the brow hair and the skin inside a mapped shape. The skin stain fades sooner than the hair stain. The service appears here for clients to read, and opens for online booking when Viola publishes a price and duration.",
    benefits: [
      "A fuller look from stain rather than makeup",
      "A mapped shape",
      "Aftercare for the first day of the stain",
    ],
    preparation: [
      "Complete a patch test if the studio asks for one.",
      "Come with clean brows.",
      "Do not book over broken or sunburned skin.",
    ],
    aftercare: [
      "Keep the brows dry immediately after the service.",
      "Avoid brow makeup and oils for the time Viola specifies.",
      "Expect the skin stain to fade first.",
    ],
    faqs: [
      {
        question: "Is henna a permanent makeup service?",
        answer: "No. It is a stain. It is not the same as nano or ombré brows.",
      },
    ],
    featured: false,
    displayOrder: 8,
    courseSlug: "eyebrow-henna",
    group: "brows",
  },
  {
    slug: "makeup",
    code: "SVC-MU",
    serviceId: "makeup",
    name: "Makeup",
    category: "Makeup",
    summary:
      "Professional makeup for an occasion, with the look agreed before the appointment.",
    longDescription:
      "Makeup appointments cover preparation, complexion, and a finished look for the occasion you describe. Tell the studio whether you need a daytime finish or an event look. Book a service opens the calendar, and makeup appears as its own appointment after a price and duration are saved.",
    benefits: [
      "A look planned for the occasion",
      "Sanitized tools",
      "A finish you can ask to keep soft or more defined",
    ],
    preparation: [
      "Arrive with clean, moisturized skin if Viola asks you to.",
      "Bring reference photos as a guide.",
      "Mention allergies or sensitive skin.",
    ],
    aftercare: [
      "Let sprays and powders settle before touching the face.",
      "Ask which products can be refreshed later in the day.",
      "Remove makeup gently that night.",
    ],
    faqs: [
      {
        question: "Can I book makeup online today?",
        answer:
          "Choose Book a service to open the calendar. Makeup appears as its own appointment after a price and duration are saved.",
      },
    ],
    featured: false,
    displayOrder: 9,
    courseSlug: "makeup-artistry",
    group: "eyes",
  },
  {
    slug: "eyelash-extensions",
    code: "SVC-EE",
    serviceId: "eyelash-extensions",
    name: "Eyelash Extensions",
    category: "Lashes",
    summary: "A classic extension set mapped to your eye.",
    longDescription:
      "Eyelash extensions are applied one lash at a time. Book a service opens this appointment.",
    benefits: [
      "A mapped set",
      "Isolation rather than a glued cluster",
      "Aftercare for fills and home washing",
    ],
    preparation: [
      "Arrive without mascara or eye cream.",
      "Postpone if you have an eye infection.",
      "Tell the studio about allergies and adhesive sensitivity.",
    ],
    aftercare: [
      "Keep the lashes dry for the first period you are given.",
      "Do not rub or use oil-based products on the set.",
      "Book a fill only on the schedule Viola recommends.",
    ],
    faqs: [
      {
        question: "What does an eyelash extension appointment include?",
        answer:
          "The set is mapped to your eye.",
      },
    ],
    featured: false,
    displayOrder: 10,
    courseSlug: "eyelash-extensions",
    group: "eyes",
  },
  {
    slug: "nails",
    code: "SVC-NL",
    serviceId: "nails",
    name: "Nail",
    category: "Nails",
    summary:
      "Nail care and color, with the exact service confirmed when you book or call.",
    longDescription:
      "Nail appointments cover care and color for the natural nail. The exact finish is confirmed with the studio so the booked time matches the work. Book a service opens the calendar. Nails appear as their own appointment after a price and duration are saved.",
    benefits: [
      "A clean preparation",
      "Color agreed before the appointment",
      "Tools kept to the studio’s hygiene rules",
    ],
    preparation: [
      "Remove heavy extensions only if the studio asks you to arrive without them.",
      "Mention damaged or infected skin around the nails.",
      "Say if you want a short everyday finish or a longer occasion finish.",
    ],
    aftercare: [
      "Wear gloves for harsh cleaning on the first day.",
      "Do not pick lifting product.",
      "Return for removal rather than peeling color off.",
    ],
    faqs: [
      {
        question: "Which nail services are included?",
        answer:
          "Viola confirms the nail menu when the service is priced. This page does not invent a price list.",
      },
    ],
    featured: false,
    displayOrder: 11,
    courseSlug: "nail-technology",
    group: "beauty",
  },
  {
    slug: "waxing",
    code: "SVC-WX",
    serviceId: "waxing",
    name: "Wax",
    category: "Waxing",
    summary: "Waxing with a consultation for skin and the area being treated.",
    longDescription:
      "Waxing appointments start with a check that the skin is suitable that day. The area and wax type are confirmed before work begins. Book a service opens the calendar. Waxing appears as its own appointment after a price and duration are saved.",
    benefits: [
      "A consultation before wax is heated for you",
      "Separate spatulas and hygiene steps",
      "Aftercare for redness on the day",
    ],
    preparation: [
      "Hair should be long enough for the wax to grip. Ask the studio for the length they need.",
      "Do not book over sunburn, broken skin, or a fresh peel.",
      "Tell the studio about recent retinoids or skin treatments.",
    ],
    aftercare: [
      "Avoid heat, perfume, and tight friction on the area that day.",
      "Do not exfoliate until the studio says the skin has settled.",
      "Contact Viola if the skin reacts beyond ordinary redness.",
    ],
    faqs: [
      {
        question: "Can I choose the area online?",
        answer:
          "Choose Book a service to open the calendar. The area is confirmed with the studio, and waxing appears as its own appointment after a price and duration are saved.",
      },
    ],
    featured: false,
    displayOrder: 12,
    courseSlug: "professional-waxing",
    group: "beauty",
  },
];

export const serviceGroups = [
  {
    id: "brows",
    title: "Brow Treatments",
    text: "Nano, ombré, combo, lamination, and henna.",
  },
  {
    id: "lips",
    title: "Lip Treatments",
    text: "Lip blushing and lip neutralization.",
  },
  {
    id: "eyes",
    title: "Makeup and Lashes",
    text: "Eyeliner, eyelash extensions, and makeup.",
  },
  {
    id: "beauty",
    title: "Nail and Wax",
    text: "Nail appointments and waxing.",
  },
] as const;
