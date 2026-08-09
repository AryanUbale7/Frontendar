export type ElementType =
  | "title"
  | "subtitle"
  | "name"
  | "uniqueId"
  | "eventName"
  | "date"
  | "logo"
  | "signature"
  | "qrCode"
  | "customText";

export interface CanvasElement {
  id: string;
  type: ElementType;
  label: string;
  text?: string;
  x: number; // Percentage (0-100) or pixels relative to canvas width
  y: number; // Percentage (0-100) or pixels relative to canvas height
  fontSize: number; // in pixels
  fontFamily: string;
  fontStyle?: "normal" | "italic" | "bold" | "bold italic";
  color: string;
  align: "left" | "center" | "right";
  width?: number; // width in pixels for image/QR/container
  height?: number; // height in pixels for image/QR/container
  visible: boolean;
  dataUrl?: string; // base64 for logo / signature
}

export interface CertificateLayout {
  width: number; // default 1000
  height: number; // default 700
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  showFrame: boolean;
  frameStyle: "classic" | "modern" | "dark" | "minimal";
  elements: CanvasElement[];
}

export interface CertificateRecord {
  id: string;
  uniqueId: string;
  participantName: string;
  eventName?: string;
  issueDate?: string;
  status: "ACTIVE" | "REVOKED" | string;
  templateId?: string;
  snapshotLayout?: CertificateLayout;
  createdAt: string;
}

export interface CertificateTemplateRecord {
  id: string;
  title: string;
  description?: string;
  layout: CertificateLayout;
  createdAt: string;
  updatedAt: string;
}
