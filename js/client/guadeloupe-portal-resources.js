// ═══ Ressources statiques Guadeloupe Explor (espace.csbusiness.fr/clients/taina/) ═══

function getGuadeloupeResourcesBase() {
  return new URL('/clients/taina/', window.location.origin).href;
}

function isGuadeloupePortalClient(profile) {
  if (!profile) return false;
  var company = String(profile.company || '').toLowerCase();
  var program = String(profile.program || '').toLowerCase();
  var email = String(profile.email || '').toLowerCase();
  if (company.indexOf('guadeloupe') !== -1 || company.indexOf('explor') !== -1) return true;
  if (program.indexOf('explor') !== -1 || program.indexOf('guadeloupe') !== -1) return true;
  if (email.indexOf('guadeloupe-explor') !== -1 || email.indexOf('ttharsis') !== -1) return true;
  return false;
}

async function shouldShowGuadeloupeResources(clientId) {
  try {
    var u = await db.auth.getUser();
    var email = String((((u || {}).data || {}).user || {}).email || '').toLowerCase();
    if (email.indexOf('guadeloupe-explor') !== -1 || email.indexOf('ttharsis') !== -1) return true;
  } catch (e) {}
  try {
    var p = await db.from('profiles').select('company, program, email').eq('id', clientId).single();
    var row = p && p.data ? p.data : {};
    if (isGuadeloupePortalClient(row)) return true;
  } catch (e) {}
  return false;
}

function buildGuadeloupeResourcesHtml() {
  var base = getGuadeloupeResourcesBase();
  if (typeof buildFsyRow !== 'function') return '';
  var row = buildFsyRow;
  var html = '';

  html += '<div style="margin-bottom:24px;padding:16px;border:1px solid rgba(194,122,90,0.35);border-radius:12px;background:#151515">';
  html += '<h3 style="font-family:Playfair Display,serif;color:#d4956f;font-size:1.05rem;margin:0 0 8px">Parcours clients &amp; automatisation</h3>';
  html += '<p style="font-size:0.78rem;color:#888;margin:0 0 12px;line-height:1.4">Tous les livrables utiles pour structurer tes excursions et l’automation.</p>';
  html += row(base + 'parcours-client-complet-taina.html', 'Parcours client complet (3 flux)', 'DIP · Site info@ · B2B Ponant/UCPA.', '🛤️');
  html += row(base + 'parcours-automatisation-3-excursions.html', 'Parcours mail → clôture', 'Meurtre au Paradis, Basse-Terre, Grande-Terre.', '📬');
  html += row(base + 'prompts-claude-taina.html', 'Prompts Claude', 'Regiondo, UTM, projet Meurtre au Paradis.', '🤖');
  html += row(base + 'feuille-de-route-taina.html', 'Feuille de route', 'Jalons du programme.', '📅');
  html += row(base + 'process-excursions-types-alertes-remplissable.html', 'Process par type d’excursion', 'Fiche remplissable + alertes.', '📋');
  html += '</div>';

  html += '<div style="margin-bottom:24px;padding:16px;border:1px solid rgba(194,122,90,0.35);border-radius:12px;background:#151515">';
  html += '<h3 style="font-family:Playfair Display,serif;color:#d4956f;font-size:1.05rem;margin:0 0 12px">Automatisations</h3>';
  html += row(base + 'automatisations-taina-plan-global.html', 'Plan global', 'Vue des 4 automatisations V1.', '🗺️');
  html += row(base + 'automatisations-taina-atelier-remplissable.html', 'Atelier remplissable', 'Co-construction process.', '✏️');
  html += row(base + 'auto-01-leads-qualification-reponse-remplissable.html', 'Auto 01 — Leads', 'Qualification + réponse.', '①');
  html += row(base + 'auto-02-relance-paiements-remplissable.html', 'Auto 02 — Paiements', 'Relances encaissement.', '②');
  html += row(base + 'auto-03-choix-menu-consolidation-remplissable.html', 'Auto 03 — Menus', 'Menus & consolidation.', '③');
  html += row(base + 'auto-04-post-excursion-feedback-remplissable.html', 'Auto 04 — Post-excursion', 'Feedback & clôture.', '④');
  html += '</div>';

  html += '<div style="margin-bottom:24px;padding:16px;border:1px solid rgba(194,122,90,0.35);border-radius:12px;background:#151515">';
  html += '<h3 style="font-family:Playfair Display,serif;color:#d4956f;font-size:1.05rem;margin:0 0 12px">Outils &amp; tutos</h3>';
  html += row(base + 'tuto-plaud-taina-web-telephone-enregistreur.html', 'Tuto PLAUD', 'Enregistrement & comptes-rendus.', '🎙️');
  html += row(base + 'diagnostic-spam-email-instructions.html', 'Diagnostic spam e-mail', 'contact@ / info@.', '📧');
  html += row(base + 'cockpit-seance-6-taina.html', 'Cockpit séance 6', 'Référence atelier décision.', '🎯');
  html += '</div>';

  return html;
}

function getGuadeloupeQuickLinksForDashboard() {
  var base = getGuadeloupeResourcesBase();
  return [
    { url: base + 'parcours-client-complet-taina.html', title: '3 parcours clients', desc: 'Carte DIP · Site · B2B', icon: '🛤️' },
    { url: base + 'parcours-automatisation-3-excursions.html', title: 'Parcours automation', desc: 'MAP · BT · GT', icon: '📬' },
    { url: base + 'prompts-claude-taina.html', title: 'Prompts Claude', desc: 'Dans l’onglet Ressources', icon: '🤖' },
    { url: base + 'automatisations-taina-atelier-remplissable.html', title: 'Atelier auto', desc: 'Fiches remplissables', icon: '✏️' },
    { url: base + 'feuille-de-route-taina.html', title: 'Feuille de route', desc: 'Jalons', icon: '📅' },
    { url: base + 'tuto-plaud-taina-web-telephone-enregistreur.html', title: 'Tuto PLAUD', desc: 'Enregistrements', icon: '🎙️' }
  ];
}
