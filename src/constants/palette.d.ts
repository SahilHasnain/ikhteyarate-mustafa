export declare const Colors: {
  readonly light: {
    readonly background: string; readonly surface: string; readonly surfaceRaised: string; readonly surfaceSelected: string;
    readonly text: string; readonly textSecondary: string; readonly primary: string; readonly primaryStrong: string;
    readonly onPrimary: string; readonly accent: string; readonly border: string; readonly success: string;
    readonly warning: string; readonly error: string; readonly backgroundElement: string; readonly backgroundSelected: string;
  };
  readonly dark: {
    readonly background: string; readonly surface: string; readonly surfaceRaised: string; readonly surfaceSelected: string;
    readonly text: string; readonly textSecondary: string; readonly primary: string; readonly primaryStrong: string;
    readonly onPrimary: string; readonly accent: string; readonly border: string; readonly success: string;
    readonly warning: string; readonly error: string; readonly backgroundElement: string; readonly backgroundSelected: string;
  };
};
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
