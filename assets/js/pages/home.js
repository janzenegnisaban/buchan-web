/**
 * Home page chrome only — job cards are filled by public-jobs-bootstrap.js
 * so openings still appear if ES modules / Supabase JS fail.
 */
import { renderHeader, renderFooter } from "../ui.js";

renderHeader("home").catch(() => {});
renderFooter();
