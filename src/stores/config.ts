import { Store } from "chstore";
import { newPages, Pages } from "../Pages";

export const editorValue = new Store(newPages.pages.length ? newPages.pageToString(newPages.pages[0]._id) : "");
export const lastActivePage = new Store(Pages.getPageName(editorValue.get()));
export const commandPaletteShown = new Store(false);