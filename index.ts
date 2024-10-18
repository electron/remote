import * as Electron from 'electron';
import { isVersionGreaterOrEqual } from './src/common/utils';

const electronVersion = process.versions.electron;

// Check if WebContentsView exists and if the version is >= 29.0.0
let WebContentsView_: any; // Use 'any' for dynamic checking

if (isVersionGreaterOrEqual('29.0.0', electronVersion) && 'WebContentsView' in Electron) {
    WebContentsView_ = Electron.WebContentsView; // Assign if it exists
} else {
    console.warn("WebContentsView is not available in this version of Electron.");
    WebContentsView_ = undefined; // Explicitly set to undefined if not available
}

// Export the WebContentsView for use in other parts of your application
export const WebContentsView = WebContentsView_;
