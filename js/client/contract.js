async function downloadStorageDoc(path, btnId) {
  const btn = document.getElementById(btnId);
  const badge = btn.querySelector('.doc-badge');
  badge.textContent = 'Chargement...';
  badge.style.background = '#333';
  badge.style.color = '#999';

  try {
    const { data, error } = await db.storage
      .from('documents')
      .createSignedUrl(path, 3600);

    if (error) throw error;
    window.open(data.signedUrl, '_blank');
    badge.textContent = 'Télécharger';
    badge.style.background = 'rgba(194,122,90,0.15)';
    badge.style.color = '#C27A5A';
  } catch(e) {
    console.error('Erreur téléchargement:', e);
    badge.textContent = 'Erreur — contacte Catherine';
    badge.style.background = 'rgba(248,113,113,0.15)';
    badge.style.color = '#f87171';
    setTimeout(function() {
      badge.textContent = 'Télécharger';
      badge.style.background = 'rgba(194,122,90,0.15)';
      badge.style.color = '#C27A5A';
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
    gridContainer.innerHTML = '<div style="text-align:center;padding:40px 0;color:#666666;">Les informations de ton contrat apparaîtront ici.</div>';
    return;
  }

  // Programme card
  let gridHtml =
    '<div class="admin-card">' +
      '<h3>Programme</h3>' +
      '<div class="admin-row"><span class="label">Formule</span><span class="value">' + (contract.program_name || '') + '</span></div>' +
      (contract.start_date ? '<div class="admin-row"><span class="label">Début</span><span class="value">' + formatDate(contract.start_date) + '</span></div>' : '') +
      (contract.end_date ? '<div class="admin-row"><span class="label">Fin</span><span class="value">' + formatDate(contract.end_date) + '</span></div>' : '') +
      '<div class="admin-row"><span class="label">Montant total</span><span class="value">' + (contract.total_amount ? contract.total_amount.toLocaleString('fr-FR') + ' € HT' : '—') + '</span></div>' +
    '</div>';

  // Paiements card
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
        statusLabel = 'Payé';
      } else if (p.status_label) {
        statusClass = 'status-pending';
        statusLabel = p.status_label;
      } else {
        var dueDate = p.date ? new Date(p.date + 'T00:00:00') : null;
        if (dueDate && dueDate < now) {
          statusClass = 'status-due';
          statusLabel = 'En retard';
        } else {
          statusClass = 'status-pending';
          statusLabel = p.date ? 'Échéance ' + formatDate(p.date) : 'À venir';
        }
      }

      gridHtml += '<div class="admin-row"><span class="label">' + (p.label || '') + '</span><span class="value ' + statusClass + '">' + (p.amount ? p.amount.toLocaleString('fr-FR') + ' € — ' + statusLabel : '—') + '</span></div>';
    });

    gridHtml += '<div class="admin-progress-bar"><div class="admin-progress-fill" style="width:' + pct + '%"></div></div>' +
      '<div style="margin-top:8px; font-size:0.8rem; color:#666666;">' + pct + '% payé — Reste ' + remaining.toLocaleString('fr-FR') + ' €</div>' +
    '</div>';
  }

  gridContainer.innerHTML = gridHtml;

  // Documents
  if (contract.documents && contract.documents.length > 0) {
    docsTitle.style.display = 'block';
    let docsHtml = '';

    contract.documents.forEach(function(doc, idx) {
      const icon = doc.type === 'contrat' ? '📋' : '🧾';
      const hasUrl = doc.url && doc.url.length > 0;
      const hasPath = doc.path && doc.path.length > 0;
      const docId = 'doc-btn-' + idx;
      const dateStr = doc.date ? formatDate(doc.date) : '';

      var btnStyle = 'display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:8px; font-size:0.75rem; font-weight:600; border:none; cursor:pointer; transition:all 0.2s;';

      if (hasPath) {
        docsHtml += '<div id="' + docId + '" style="display:flex; align-items:center; gap:12px; padding:12px 16px; background:#1a1a1a; border:1px solid #2a2a2a; border-radius:10px; margin-bottom:8px;">' +
          '<span style="font-size:1.1rem;">' + icon + '</span>' +
          '<div style="flex:1;"><div style="font-size:0.9rem; font-weight:500;">' + (doc.name || '') + '</div>' + (dateStr ? '<div style="font-size:0.75rem; color:#666666;">' + dateStr + '</div>' : '') + '</div>' +
          '<button class="doc-badge" onclick="downloadStorageDoc(\'' + doc.path + '\', \'' + docId + '\')" style="' + btnStyle + 'background:rgba(194,122,90,0.15); color:#C27A5A;">⬇ Télécharger</button>' +
        '</div>';
      } else if (hasUrl) {
        docsHtml += '<div style="display:flex; align-items:center; gap:12px; padding:12px 16px; background:#1a1a1a; border:1px solid #2a2a2a; border-radius:10px; margin-bottom:8px;">' +
          '<span style="font-size:1.1rem;">' + icon + '</span>' +
          '<div style="flex:1;"><div style="font-size:0.9rem; font-weight:500;">' + (doc.name || '') + '</div>' + (dateStr ? '<div style="font-size:0.75rem; color:#666666;">' + dateStr + '</div>' : '') + '</div>' +
          '<a href="' + doc.url + '" target="_blank" style="text-decoration:none; ' + btnStyle + 'background:rgba(194,122,90,0.15); color:#C27A5A;">⬇ Télécharger</a>' +
        '</div>';
      } else {
        docsHtml += '<div style="display:flex; align-items:center; gap:12px; padding:12px 16px; background:#1a1a1a; border:1px solid #2a2a2a; border-radius:10px; margin-bottom:8px; opacity:0.5;">' +
          '<span style="font-size:1.1rem;">' + icon + '</span>' +
          '<div style="flex:1;"><div style="font-size:0.9rem; font-weight:500;">' + (doc.name || '') + '</div>' + (dateStr ? '<div style="font-size:0.75rem; color:#666666;">' + dateStr + '</div>' : '') + '</div>' +
          '<span style="font-size:0.75rem; color:#666666; font-style:italic;">Bientôt disponible</span>' +
        '</div>';
      }
    });

    docsContainer.innerHTML = docsHtml;
  } else {
    docsTitle.style.display = 'none';
    docsContainer.innerHTML = '';
  }
}
