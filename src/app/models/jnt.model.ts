export type JntEnvironment = 'testing' | 'live';

export interface JntConfig {
  environment: JntEnvironment;
  // 1. Order & Cancellation Credentials
  username: string;
  apiKey: string;
  orderKey: string;
  orderCreateEndpoint: string;
  orderCancelEndpoint: string;

  // 2. Tariff Check Credentials
  customerName: string;
  tariffKey: string;
  tariffEndpoint: string;

  // 3. Track Credentials (Basic Auth)
  trackUsername: string;
  trackPassword: string;
  trackEndpoint: string;

  // Default Shipper Details (Gudang SYB Surabaya)
  originCode: string;
  sendSiteCode: string;
  shipperName: string;
  shipperContact: string;
  shipperPhone: string;
  shipperAddr: string;
  shipperCity: string;
  shipperZip: string;
  defaultGoodsDesc: string;
  apiProxyUrl?: string;
}

export interface JntOrderDetailItem {
  username: string;
  api_key: string;
  orderid: string;
  shipper_name: string;
  shipper_contact: string;
  shipper_phone: string;
  shipper_addr: string;
  origin_code: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_addr: string;
  receiver_zip: string;
  destination_code: string;
  receiver_area: string;
  qty: string;
  weight: string;
  goodsdesc: string;
  servicetype: string;
  insurance: string;
  orderdate: string;
  item_name: string;
  cod: string;
  sendstarttime: string;
  sendendtime: string;
  expresstype: string;
  goodsvalue: string;
}

export interface JntCreateOrderDataParam {
  detail: JntOrderDetailItem[];
}

export interface JntCreateOrderResponseDetail {
  orderid?: string;
  status?: string;
  awb_no?: string | null;
  reason?: string;
  desccode?: string;
  etd?: string;
}

export interface JntCreateOrderResponse {
  success?: boolean;
  desc?: string;
  detail?: JntCreateOrderResponseDetail[];
  error?: string;
}

export interface JntAwbResult {
  success: boolean;
  awbNo?: string;
  desccode?: string;
  etd?: string;
  isFallback?: boolean;
  message: string;
  rawResponse?: unknown;
  requestPayload?: JntCreateOrderDataParam;
  dataSign?: string;
}

export interface JntTariffInquiryData {
  weight: string;
  sendSiteCode: string;
  destAreaCode: string;
  cusName: string;
  productType: string;
}

export interface JntTariffCostItem {
  cost?: string | number;
  name?: string;
  productType?: string;
  etd?: string;
}

export interface JntCancelDetailItem {
  username: string;
  api_key: string;
  orderid: string;
  remark: string;
}

export interface JntCancelOrderResult {
  success: boolean;
  status?: string;
  reason?: string;
  message: string;
  rawResponse?: unknown;
}

export interface JntTrackHistoryItem {
  dateTime: string;
  cityName?: string;
  status: string;
  statusCode?: string;
  note?: string;
}

export interface JntTrackResult {
  success: boolean;
  awb: string;
  status?: string;
  history: JntTrackHistoryItem[];
  message: string;
  rawResponse?: unknown;
}

