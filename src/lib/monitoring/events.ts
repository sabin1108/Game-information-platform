export type DeviceClass = "mobile" | "tablet" | "desktop";

export type ClientErrorMonitoringEvent = {
  type: "client_error";
  message: string;
  stack?: string;
  route?: string;
  source?: string;
};

export type ServerErrorMonitoringEvent = {
  type: "server_error";
  message: string;
  stack?: string;
  route?: string;
  source?: string;
};

export type WebVitalMonitoringEvent = {
  type: "web_vital";
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  route: string;
  deviceClass: DeviceClass;
};

export type ApiRequestMonitoringEvent = {
  type: "api_request";
  route: string;
  method: string;
  status: number;
  durationMs: number;
  cacheStatus: string;
};

export type MonitoringEvent =
  | ClientErrorMonitoringEvent
  | ServerErrorMonitoringEvent
  | WebVitalMonitoringEvent
  | ApiRequestMonitoringEvent;

export function getDeviceClass(width: number): DeviceClass {
  if (width < 768) {
    return "mobile";
  }

  if (width < 1024) {
    return "tablet";
  }

  return "desktop";
}
