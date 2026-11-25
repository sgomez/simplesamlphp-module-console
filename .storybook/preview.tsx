import type { Preview } from "@storybook/react-vite";
import { destroyAnnouncer } from "react-aria/private/live-announcer/LiveAnnouncer";
import { MemoryRouter } from "react-router";
import "../frontend/src/console.css";
import { LinkRouter } from "../frontend/src/design-system/LinkRouter";

const SCHEME = {
  system: "(prefers-color-scheme:dark)",
  light: "not all",
  dark: "all",
};

// console.css follows the system theme only; rewriting its dark media rule forces either theme here.
function applyScheme(scheme: keyof typeof SCHEME) {
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules)) {
      if (rule instanceof CSSMediaRule && rule.cssText.includes("--")) {
        const text = rule.media.mediaText;
        if (
          text.includes("prefers-color-scheme") ||
          text === "all" ||
          text === "not all"
        ) {
          rule.media.mediaText = SCHEME[scheme];
        }
      }
    }
  }
}

const preview: Preview = {
  globalTypes: {
    scheme: {
      description: "Theme",
      toolbar: {
        icon: "mirror",
        items: [
          { value: "system", title: "System" },
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { scheme: "system" },
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    options: {
      storySort: { order: ["Foundations", "Design system", "Domain", "Pages"] },
    },
  },
  // A settled pending button leaves React Aria's announcement for seconds, which axe rejects in the next story.
  beforeEach: () => {
    destroyAnnouncer();
  },
  decorators: [
    (Story, { parameters, globals }) => {
      applyScheme(
        (globals["scheme"] as keyof typeof SCHEME | undefined) ?? "system",
      );
      return (
        <MemoryRouter
          initialEntries={[(parameters["route"] as string | undefined) ?? "/"]}
        >
          <LinkRouter>
            <Story />
          </LinkRouter>
        </MemoryRouter>
      );
    },
  ],
};

export default preview;
