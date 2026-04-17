# Paperclip Integration — Agents accès `tasks`

## Agents autorisés

- **Pixou** (notifications tâches urgentes)
- **CEO** (générer CR, ajouter tâches)
- **Sio** (opérationnel futur)

## Accès Supabase

**Configuration** :

```env
SUPABASE_URL=https://dcynlifggjiqqihincbp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Obtenir la `SERVICE_ROLE_KEY`** :
1. Aller sur https://app.supabase.com
2. Projet : CS Consulting Strategique (dcynlifggjiqqihincbp)
3. Settings → API → Service Role Key (copier)

## Python Client (agents)

```python
from supabase import create_client, Client

url = "https://dcynlifggjiqqihincbp.supabase.co"
key = "votre_service_role_key"
supabase: Client = create_client(url, key)

# Lire toutes les tâches
response = supabase.table('tasks').select('*').execute()
tasks = response.data

# Lire tâches non faites (todo)
urgent_tasks = supabase.table('tasks').select('*').eq('status', 'todo').eq('priority', 2).execute()

# Ajouter une tâche
supabase.table('tasks').insert({
    'title': 'Nouvelle tâche du CEO',
    'category': 'clients',
    'type': 'pro',
    'priority': 1,
    'created_by': 'ceo',
    'detail': 'À faire avant vendredi'
}).execute()

# Marquer comme fait
supabase.table('tasks').update({
    'status': 'done',
    'completed_at': 'now()',
    'updated_by': 'pixou'
}).eq('id', 'task_id').execute()
```

## Cas d'usage

### Pixou: Alerter Catherine des tâches urgentes

```python
# Script: agent_pixou_alerts.py
urgent = supabase.table('tasks').select('*')\
    .eq('status', 'todo')\
    .eq('priority', 2)\
    .execute()

if urgent.data:
    message = "🔴 Tâches urgentes :\n"
    for task in urgent.data:
        message += f"- {task['title']} ({task['category']})\n"
    # Envoyer à Catherine via WhatsApp/Slack
```

### CEO: Générer CR hebdomadaire

```python
# Script: agent_ceo_weekly_recap.py
import datetime

# Tâches complétées cette semaine
week_start = datetime.date.today() - datetime.timedelta(days=datetime.date.today().weekday())
week_end = week_start + datetime.timedelta(days=7)

completed = supabase.table('tasks').select('*')\
    .gte('completed_at', str(week_start))\
    .lte('completed_at', str(week_end))\
    .execute()

# Tâches en cours (non faites)
pending = supabase.table('tasks').select('*')\
    .eq('status', 'todo')\
    .execute()

recap = f"""
# Récap semaine du {week_start}

## Tâches complétées ({len(completed.data)})
{'\n'.join([f"✓ {t['title']}" for t in completed.data])}

## Tâches en cours ({len(pending.data)})
{'\n'.join([f"- {t['title']} (priorité: {t['priority']})" for t in pending.data])}
"""

# Envoyer le récap
```

### Sio: Ajouter/modifier tâches

```python
# Script: agent_sio_task_management.py

# Ajouter une nouvelle tâche
supabase.table('tasks').insert({
    'title': 'Contacter Fred pour session 11',
    'category': 'clients',
    'type': 'pro',
    'created_by': 'sio',
    'detail': 'Planifier la séance 11'
}).execute()

# Mettre à jour
supabase.table('tasks').update({
    'detail': 'Décalé au 20 avril',
    'updated_by': 'sio'
}).eq('id', 'task_id').execute()
```

## Déploiement agents Paperclip

**Sur Paperclip (instance VPS)** :

1. **Créer fichier** `/var/www/agents/tasks-sync.py`
2. **Installer dépendances** : `pip install supabase`
3. **Configurer env vars** dans Paperclip :
   ```
   export SUPABASE_SERVICE_ROLE_KEY=xxx
   export SUPABASE_URL=xxx
   ```
4. **Intégrer dans agent config** (Pixou, CEO, Sio)
5. **Tester** : agent peut lire/écrire tasks

## Sécurité

- ✅ Service Role Key = accès full (à garder secret)
- ✅ Ne JAMAIS commiter SERVICE_ROLE_KEY en clair
- ✅ Utiliser variables d'environnement Paperclip
- ⚠️ Tous les agents trusted (Catherine, Pixou, CEO, Sio) = pas de RLS restriction

## Testing

```bash
# Tester connexion Supabase
python -c "
from supabase import create_client
url = 'https://dcynlifggjiqqihincbp.supabase.co'
key = 'SERVICE_ROLE_KEY'
db = create_client(url, key)
tasks = db.table('tasks').select('*').limit(1).execute()
print('✓ Connexion OK' if tasks.data else '✗ Erreur')
"

# Tester lecture
python -c "
from supabase import create_client
db = create_client(url, key)
tasks = db.table('tasks').select('*').execute()
print(f'✓ {len(tasks.data)} tâches trouvées')
"
```

## Status

- [x] Service Role Key identifiée
- [ ] Agents Paperclip configurés
- [ ] Tests Pixou alert
- [ ] Tests CEO recap
- [ ] Sio integration
