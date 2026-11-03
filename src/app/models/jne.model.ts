export type JneEnvironment = 'sandbox' | 'live';

export interface JneConfig {
  environment: JneEnvironment;
  username: string;
  apiKey: string;
  branch: string;
  cust: string;
  originCode: string;
  shipperName: string;
  shipperAddr1: string;
  shipperAddr2: string;
  shipperCity: string;
  shipperZip: string;
  shipperPhone: string;
  defaultGoodsDesc: string;
  defaultGoodsInstruction: string;
  apiProxyUrl?: string;
}

export interface JneGenerateCnotePayload {
  username: string;
  api_key: string;
  OLSHOP_BRANCH: string;
  OLSHOP_CUST: string;
  OLSHOP_ORDERID: string;
  OLSHOP_SHIPPER_NAME: string;
  OLSHOP_SHIPPER_ADDR1: string;
  OLSHOP_SHIPPER_ADDR2: string;
  OLSHOP_SHIPPER_ADDR3?: string;
  OLSHOP_SHIPPER_CITY: string;
  OLSHOP_SHIPPER_REGION?: string;
  OLSHOP_SHIPPER_ZIP: string;
  OLSHOP_SHIPPER_PHONE: string;
  OLSHOP_RECEIVER_NAME: string;
  OLSHOP_RECEIVER_ADDR1: string;
  OLSHOP_RECEIVER_ADDR2: string;
  OLSHOP_RECEIVER_ADDR3?: string;
  OLSHOP_RECEIVER_CITY: string;
  OLSHOP_RECEIVER_REGION?: string;
  OLSHOP_RECEIVER_ZIP: string;
  OLSHOP_RECEIVER_PHONE: string;
  OLSHOP_QTY: string;
  OLSHOP_WEIGHT: string;
  OLSHOP_GOODSDESC: string;
  OLSHOP_GOODSVALUE: string;
  OLSHOP_GOODSTYPE: string;
  OLSHOP_INST?: string;
  OLSHOP_INS_FLAG: 'Y' | 'N';
  OLSHOP_ORIG: string;
  OLSHOP_DEST: string;
  OLSHOP_SERVICE: string;
  OLSHOP_COD_FLAG: 'YES' | 'N';
  OLSHOP_COD_AMOUNT: string;
}

export interface JneCnoteDetail {
  status: string;
  cnote_no?: string | null;
  reason?: string;
  error?: string;
}

export interface JneGenerateCnoteResponse {
  detail?: JneCnoteDetail[];
  status?: string | boolean;
  error?: string;
}

export interface JneAwbResult {
  success: boolean;
  cnoteNo?: string;
  isFallback?: boolean;
  message: string;
  rawResponse?: unknown;
  requestPayload?: JneGenerateCnotePayload;
}

export interface JneTariffPayload {
  username: string;
  api_key: string;
  from: string;
  thru: string;
  weight: string;
}

export interface JnePriceItem {
  origin_name: string;
  destination_name: string;
  service_display: string;
  service_code: string;
  goods_type: string;
  currency: string;
  price: string;
  etd_from?: string;
  etd_thru?: string;
  times?: string;
}

export interface JneTariffResponse {
  price?: JnePriceItem[];
  error?: string;
}

export interface JneTariffOption {
  serviceCode: string;
  serviceDisplay: string;
  serviceName: string;
  price: number;
  etd: string;
  isRecommended?: boolean;
  badge?: string;
}

export interface DestinationOption {
  code: string;
  city: string;
  province: string;
  group: string;
}

