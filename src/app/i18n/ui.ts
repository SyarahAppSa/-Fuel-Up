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
