/* UI strings used inside component logic (forms, maps, operations room, slider). */
export interface UiStrings {
  slider: { play: string; pause: string };
  map: { aria: string; hubPrefix: string; selectCity: string; otherCity: string; otherCityMsg: string; yesCity: string };
  form: {
    quote: string; contact: string; kindQuote: string; kindContact: string;
    required: string; mobile: string; email: string; details: string; consent: string; review: string;
    sent: string; notOpened: string; greeting: string; wantQuote: string; wantContact: string;
    labels: { company: string; name: string; mobile: string; email: string; city: string; sector: string; volume: string; service: string };
    detailsLabel: string; footer: string; direct: string; referral: string; select: string; other: string;
  };
  ops: {
    illustrativeImage: string; slipAria: string; slipTitle: string; illustrative: string; sector: string; fuel: string;
    site: string; qty: string; qtyValue: string; submit: string;
    st1: [string, string]; st2: [string, string];
    routeAria: string; loadingPoint: string; dispatched: string; awaiting: string; eta: string;
    st4Alt: string; st4Cap: (site: string) => string;
    shots: string[]; protoTitle: string; protoSub: string; protoClose: string; einv: string;
    stageAria: (n: number, name: string) => string; stageNo: (n: number, sector: string) => string;
    owner: string; recorded: string; tankLoad: string; unit: string; tagA: string; tagB: string; badge: string;
    viewAria: string; view3d: string; viewImg: string; play: string; stop: string;
    simAria: string; simSteps: [string, string][];
  };
  phoneAria: string;
  tankUnit: string;
}

export const UI_AR: UiStrings = {
  slider: { play: 'تشغيل تلقائي', pause: 'إيقاف التشغيل التلقائي' },
  map: {
    aria: 'خريطة تغطية فيول آب: الوسطى والشرقية والغربية والشمالية',
    hubPrefix: ' · مركزها ',
    selectCity: 'اختر مدينتك',
    otherCity: 'مدينة أخرى',
    otherCityMsg: 'تواصل معنا على الرقم الموحد 920009088 لنحدد لك نطاق الخدمة المناسب.',
    yesCity: 'نعم، مدينتك ضمن نطاق خدمتنا في ',
  },
  form: {
    quote: 'اطلب عرضًا تشغيليًا', contact: 'تواصل معنا', kindQuote: 'طلب عرض تشغيلي', kindContact: 'تواصل معنا',
    required: 'هذا الحقل مطلوب.',
    mobile: 'أدخل رقم جوال سعوديًا من 10 أرقام يبدأ بـ 05.',
    email: 'أدخل بريدًا إلكترونيًا صحيحًا مثل name@company.com.',
    details: 'اكتب تفاصيل أكثر قليلًا حتى نجهّز لك عرضًا مناسبًا.',
    consent: 'يلزم موافقتك على سياسة الخصوصية حتى نتمكن من التواصل معك.',
    review: 'راجع الحقول المحددة ثم أعد الإرسال.',
    sent: 'جهّزنا رسالة واتساب فيها بيانات طلبك. اضغط «إرسال» داخل واتساب ليصل طلبك إلى فريق المبيعات. ',
    notOpened: 'لم يُفتح واتساب؟ اضغط هنا',
    greeting: 'السلام عليكم، ',
    wantQuote: 'أرغب في الحصول على عرض تشغيلي من فيول آب.',
    wantContact: 'أرغب في التواصل مع فريق فيول آب.',
    labels: { company: 'اسم الشركة', name: 'اسم المسؤول', mobile: 'رقم الجوال', email: 'البريد الإلكتروني', city: 'المدينة', sector: 'القطاع', volume: 'حجم الأسطول أو الاحتياج', service: 'الخدمة المطلوبة' },
    detailsLabel: '*تفاصيل الاحتياج:*',
    footer: '— أُرسلت من موقع فيول آب',
    direct: 'مباشر', referral: 'إحالة: ', select: 'اختر', other: 'أخرى',
  },
  ops: {
    illustrativeImage: 'صورة توضيحية', slipAria: 'طلب توريد، بيانات توضيحية', slipTitle: 'طلب توريد جديد', illustrative: 'بيانات توضيحية',
    sector: 'القطاع', fuel: 'نوع الوقود', site: 'موقع التسليم', qty: 'الكمية', qtyValue: 'حسب الاحتياج', submit: 'إرسال الطلب',
    st1: ['صهاريج فيول آب في ساحة التشغيل', 'إسناد الصهريج المناسب من الأسطول'],
    st2: ['شاحنات فيول آب عند نقطة تحميل', 'التعبئة عند نقطة التحميل'],
    routeAria: 'تتبع الرحلة، تصور توضيحي', loadingPoint: 'نقطة التحميل', dispatched: 'انطلقت الشحنة', awaiting: 'بانتظار الوصول',
    eta: 'في الطريق · وقت الوصول المتوقع يظهر في المنصة',
    st4Alt: 'فريق فيول آب أثناء التفريغ في موقع العميل', st4Cap: (s) => 'التفريغ في ' + s + ' وفق إجراءات السلامة',
    shots: ['قبل التعبئة', 'بعد التعبئة', 'قبل التفريغ', 'بعد التفريغ'],
    protoTitle: 'بروتوكول الصور الأربع', protoSub: 'صور توضيحية', protoClose: 'تُغلق الرحلة بعد اكتمال الصور الأربع', einv: 'فاتورة إلكترونية صادرة',
    stageAria: (n, name) => 'المرحلة ' + n + ': ' + name,
    stageNo: (n, s) => 'المرحلة 0' + n + ' من 06 · ' + s,
    owner: 'المسؤول', recorded: 'ما يُسجَّل', tankLoad: 'حمولة الصهريج', unit: ' لتر',
    tagA: 'موقع التحميل', tagB: 'موقع المشروع', badge: 'محاكاة ثلاثية الأبعاد · توضيحية',
    viewAria: 'طريقة العرض', view3d: 'ثلاثي الأبعاد', viewImg: 'صور', play: 'شغّل الرحلة', stop: 'إيقاف',
    simAria: 'محاكاة ثلاثية الأبعاد لرحلة صهريج فيول آب',
    simSteps: [
      ['التوجه للتحميل', 'الصهريج في طريقه إلى موقع تحميل أرامكو.'],
      ['التحميل', 'تعبئة الصهريج عند ذراع التحميل وتوثيقها بصورتين.'],
      ['النقل', 'الشحنة في الطريق إلى موقع المشروع، والحالة ظاهرة للعميل.'],
      ['التفريغ', 'توصيل الخرطوم بخزان الموقع وتفريغ الحمولة بحضور المسؤول.'],
      ['التوثيق والفاتورة', 'اكتمال الصور الأربع وصدور فاتورة إلكترونية مرتبطة بالطلب.'],
      ['العودة', 'الصهريج يعود إلى ساحة الأسطول جاهزًا للطلب التالي.'],
    ],
  },
  phoneAria: 'شاشة تطبيق فيول آب، بيانات توضيحية',
  tankUnit: 'لتر',
};

export const UI_EN: UiStrings = {
  slider: { play: 'Start autoplay', pause: 'Pause autoplay' },
  map: {
    aria: 'Fuel App coverage map: Central, Eastern, Western and Northern Regions',
    hubPrefix: ' · Hub: ',
    selectCity: 'Select your city',
    otherCity: 'Other city',
    otherCityMsg: 'Contact us on our unified number 920009088 and we will confirm the right service coverage for you.',
    yesCity: 'Yes, your city is within the ',
  },
  form: {
    quote: 'Request an operational quote', contact: 'Contact us', kindQuote: 'Operational quote request', kindContact: 'Contact us',
    required: 'This field is required.',
    mobile: 'Enter a 10-digit Saudi mobile number starting with 05.',
    email: 'Enter a valid email address, e.g. name@company.com.',
    details: 'Please add a little more detail so we can prepare a suitable quote for you.',
    consent: 'Please accept the Privacy Policy so that we can contact you.',
    review: 'Please review the highlighted fields and submit again.',
    sent: "We've prepared a WhatsApp message with your request details. Tap “Send” in WhatsApp to deliver your request to our sales team. ",
    notOpened: "WhatsApp didn't open? Click here",
    greeting: 'Hello, ',
    wantQuote: "I'd like to request an operational quote from Fuel App.",
    wantContact: "I'd like to get in touch with the Fuel App team.",
    labels: { company: 'Company name', name: 'Contact person', mobile: 'Mobile number', email: 'Email', city: 'City', sector: 'Sector', volume: 'Fleet size or requirement volume', service: 'Service required' },
    detailsLabel: '*Requirement details:*',
    footer: '— Sent from the Fuel App website',
    direct: 'Direct', referral: 'Referral: ', select: 'Select', other: 'Other',
  },
  ops: {
    illustrativeImage: 'Illustrative image', slipAria: 'Supply order, illustrative data', slipTitle: 'New supply order', illustrative: 'Illustrative data',
    sector: 'Sector', fuel: 'Fuel type', site: 'Delivery location', qty: 'Quantity', qtyValue: 'As required', submit: 'Submit order',
    st1: ['Fuel App tankers in the operations yard', 'Assigning the right tanker from the fleet'],
    st2: ['Fuel App trucks at a loading point', 'Filling at the loading point'],
    routeAria: 'Trip tracking, illustrative visualization', loadingPoint: 'Loading point', dispatched: 'Shipment dispatched', awaiting: 'Awaiting arrival',
    eta: 'En route · ETA shown on the platform',
    st4Alt: "Fuel App team unloading at the client's site", st4Cap: (s) => 'Safety-compliant unloading · ' + s,
    shots: ['Before filling', 'After filling', 'Before unloading', 'After unloading'],
    protoTitle: 'Four-photo protocol', protoSub: 'Illustrative images', protoClose: 'The trip closes once all four photos are complete', einv: 'E-invoice issued',
    stageAria: (n, name) => 'Stage ' + n + ': ' + name,
    stageNo: (n, s) => 'Stage 0' + n + ' of 06 · ' + s,
    owner: 'Owner', recorded: 'What is recorded', tankLoad: 'Tanker load', unit: ' L',
    tagA: 'Loading site', tagB: 'Project site', badge: '3D simulation · illustrative',
    viewAria: 'View mode', view3d: '3D', viewImg: 'Photos', play: 'Play the journey', stop: 'Stop',
    simAria: '3D simulation of a Fuel App tanker trip',
    simSteps: [
      ['Heading to loading', 'The tanker is en route to the Aramco loading site.'],
      ['Loading', 'The tanker is filled at the loading arm and documented with two photos.'],
      ['Transport', 'The shipment is en route to the project site, with status visible to the client.'],
      ['Unloading', "The hose is connected to the site tank and the load discharged in the supervisor's presence."],
      ['Documentation & invoice', 'All four photos are complete and an e-invoice linked to the order is issued.'],
      ['Return', 'The tanker returns to the fleet yard, ready for the next order.'],
    ],
  },
  phoneAria: 'Fuel App application screen, illustrative data',
  tankUnit: 'liters',
};
