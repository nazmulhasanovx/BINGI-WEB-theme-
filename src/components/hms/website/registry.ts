import type { ComponentType } from "react";
import { ContentSimple, DesignSimple, HomepageSimple, OverviewSimple, PublishSimple, SettingsSimple } from "./simple";

export const PAGE_COMPONENTS: Record<string, ComponentType> = {
  overview: OverviewSimple,
  design: DesignSimple,
  homepage: HomepageSimple,
  content: ContentSimple,
  settings: SettingsSimple,
  publish: PublishSimple,
};
