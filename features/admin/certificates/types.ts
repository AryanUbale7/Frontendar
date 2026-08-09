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
  | "description"
  | "orgName"
  | "customText";

export interface CanvasElement {
  id: string;
  type: ElementType;
  label: string;
  text?: string;
  x: number; // Percentage (0-100) relative to canvas width
  y: number; // Percentage (0-100) relative to canvas height
  fontSize: number; // in pixels
  fontFamily: string;
  fontStyle?: "normal" | "italic" | "bold" | "bold italic";
  fontWeight?: string | number;
  color: string;
  align: "left" | "center" | "right";
  width?: number; // width in pixels for image/QR/container
  height?: number; // height in pixels for image/QR/container
  visible: boolean;
  dataUrl?: string; // base64 for logo / signature
  
  // Advanced Figma/Canva properties
  zIndex?: number;
  rotation?: number; // 0 to 360 degrees
  opacity?: number; // 0 to 1
  isLocked?: boolean;
  letterSpacing?: number; // tracking in px
  lineHeight?: number; // leading multiplier (e.g. 1.2)
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  maxWidth?: number;
  autoWrap?: boolean;
}

export interface CertificateLayout {
  width: number; // default 1000
  height: number; // default 700
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  showFrame: boolean;
  frameStyle: "classic" | "modern" | "dark" | "minimal" | "none";
  backgroundImage?: string; // Base64 data URL or image path
  backgroundImageOpacity?: number;
  aspectRatio?: number; // e.g. 1.414 or 1.777
  version?: number;
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
