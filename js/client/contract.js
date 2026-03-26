async function downloadStorageDoc(path, btnId) {
  const btn = document.getElementById(btnId);
  const badge = btn.querySelector('.doc-badge');
  badge.textContent = 'Chargement...';
  badge.style.color = '#666666';

  try {
    const { data, error } = await db.storage
      .from('documents')
      .createSignedUrl(path, 3600);

    if (error) throw error;
    window.open(data.signedUrl, '_blank');
    badge.textContent = 'Telecharger';
    badge.style.color = '#4ade80';
  } catch(e) {
    console.error('Erreur telechargement:', e);
    badge.textContent = 'Erreur — contacte Catherine';
    badge.style.color = '#f87171';
    setTimeout(function() {
      badge.textContent = 'Telecharger';
      badge.style.color = '#4ade80';
    }, 3000);
  }
}

async function loadContract(clientId) {
  const { data, error } = await db
    .from('contracts')
    .select('*')
    .eq('client_id', clientId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Erreur chargement contrat:', error);
    return;
  }
  renderContract(data);
}

function renderContract(contract) {
  const gridContainer = document.getElementById('contract-grid');
  const docsTitle = document.getElementById('contract-docs-title');
  const docsContainer = document.getElementById('contract-docs');

  if (!contract) {
    gridContainer.innerHTML = '<div style="text-align:center;padding:40px 0;color:#666666;">Les informations de ton contrat apparaitront ici.</div>';
    return;
  }

  // Programme card V1
  let gridHtml =
    '<div class="admin-card">' +
      '<h3>Programme</h3>' +
      '<div class="admin-row"><span class="label">Formule</span><span class="value">' + (contract.program_name || '') + '</span></div>' +
      (contract.start_date ? '<div class="admin-row"><span class="label">Debut</span><span class="value">' + formatDate(contract.start_date) + '</span></div>' : '') +
      (contract.end_date ? '<div class="admin-row"><span class="label">Fin</span><span class="value">' + formatDate(contract.end_date) + '</span></div>' : '') +
      '<div class="admin-row"><span class="label">Montant total</span><span class="value">' + (contract.total_amount ? contract.total_amount.toLocaleString('fr-FR') + ' EUR HT' : '—') + '</span></div>' +
    '</div>';

  // Paiements card — logique dynamique basée sur la date
  if (contract.payment_schedule && contract.payment_schedule.length > 0) {
    const now = new Date();
    const paid = contract.payment_schedule.filter(function(p) { return p.status === 'paid'; });
    const paidAmount = paid.reduce(function(sum, p) { return sum + (p.amount || 0); }, 0);
    const pct = contract.total_amount ? Math.round((paidAmount / contract.total_amount) * 100) : 0;
    const remaining = contract.total_amount ? contract.total_amount - paidAmount : 0;

    gridHtml += '<div class="admin-card"><h3>Paiements</h3>';

    contract.payment_schedule.forEach(function(p) {
      var statusClass, statusLabel;

      if (p.status === 'paid') {
        statusClass = 'status-paid';
        statusLabel = 'Paye';
      } else if (p.status_label) {
        // Statut personnalisé (ex: "En attente attestation URSSAF")
        statusClass = 'status-pending';
        statusLabel = p.status_label;
      } else {
        // Calcul dynamique : en retard si date passée
        var dueDate = p.date ? new Date(p.date + 'T00:00:00') : null;
        if (dueDate && dueDate < now) {
          statusClass = 'status-due';
          statusLabel = 'En retard';
        } else {
          statusClass = 'status-pending';
          statusLabel = p.date ? 'Echeance ' + formatDate(p.date) : 'A venir';
        }
      }

      gridHtml += '<div class="admin-row"><span class="label">' + (p.label || '') + '</span><span class="value ' + statusClass + '">' + (p.amount ? p.amount.toLocaleString('fr-FR') + ' EUR — ' + statusLabel : '—') + '</span></div>';
    });

    gridHtml += '<div class="admin-progress-bar"><div class="admin-progress-fill" style="width:' + pct + '%"></div></div>' +
      '<div style="margin-top:8px; font-size:0.8rem; color:#666666;">' + pct + '% paye — Reste ' + remaining.toLocaleString('fr-FR') + ' EUR</div>' +
    '</div>';
  }

  gridContainer.innerHTML = gridHtml;

  // Documents V1
  if (contract.documents && contract.documents.length > 0) {
    docsTitle.style.display = 'block';
    let docsHtml = '';

    contract.documents.forEach(function(doc, idx) {
      const icon = doc.type === 'contrat' ? '📋' : '🧾';
      const hasUrl = doc.url && doc.url.length > 0;
      const hasPath = doc.path && doc.path.length > 0;
      const isClickable = hasUrl || hasPath;
      const docId = 'doc-btn-' + idx;
      const dateStr = doc.date ? formatDate(doc.date) : '';

      if (hasPath) {
        // Document dans Supabase Storage — URL signée à la volée
        docsHtml += '<div id="' + docId + '" style="display:flex; align-items:center; gap:12px; padding:10px 16px; background:#1a1a1a; border:1px solid #2a2a2a; border-radius:8px; margin-bottom:6px; transition:border-color 0.2s; cursor:pointer;" onmouseover="this.style.borderColor=\'#C27A5A\'" onmouseout="this.style.borderColor=\'#2a2a2a\'" onclick="downloadStorageDoc(\'' + doc.path + '\', \'' + docId + '\')">' +
          '<span style="font-size:1.1rem;">' + icon + '</span>' +
          '<div style="flex:1;"><div style="font-size:0.9rem; font-weight:500;">' + (doc.name || '') + '</div><div style="font-size:0.75rem; color:#666666;">' + dateStr + '</div></div>' +
          '<span class="doc-badge" style="font-size:0.7rem; color:#4ade80; font-weight:500;">Telecharger</span>' +
        '</div>';
      } else if (hasUrl) {
        // URL directe
        docsHtml += '<a href="' + doc.url + '" target="_blank" style="text-decoration:none; color:inherit; display:flex; align-items:center; gap:12px; padding:10px 16px; background:#1a1a1a; border:1px solid #2a2a2a; border-radius:8px; margin-bottom:6px; transition:border-color 0.2s; cursor:pointer;" onmouseover="this.style.borderColor=\'#C27A5A\'" onmouseout="this.style.borderColor=\'#2a2a2a\'">' +
          '<span style="font-size:1.1rem;">' + icon + '</span>' +
          '<div style="flex:1;"><div style="font-size:0.9rem; font-weight:500;">' + (doc.name || '') + '</div><div style="font-size:0.75rem; color:#666666;">' + dateStr + '</div></div>' +
          '<span style="font-size:0.7rem; color:#4ade80; font-weight:500;">Telecharger</span>' +
        '</a>';
      } else {
        // Pas encore disponible
        docsHtml += '<div style="display:flex; align-items:center; gap:12px; padding:10px 16px; background:#1a1a1a; border:1px solid #2a2a2a; border-radius:8px; margin-bottom:6px; opacity:0.6;">' +
          '<span style="font-size:1.1rem;">' + icon + '</span>' +
          '<div style="flex:1;"><div style="font-size:0.9rem; font-weight:500;">' + (doc.name || '') + '</div><div style="font-size:0.75rem; color:#666666;">' + dateStr + '</div></div>' +
          '<span style="font-size:0.7rem; color:#666666; font-style:italic;">Bientot disponible</span>' +
        '</div>';
      }
    });

    docsContainer.innerHTML = docsHtml;
  } else {
    docsTitle.style.display = 'none';
    docsContainer.innerHTML = '';
  }
}
