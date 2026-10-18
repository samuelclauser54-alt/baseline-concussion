import { useRef, useState } from 'react'
import { Button, Card, Icon, SectionTitle, TopBar } from '../components/ui'
import { loadDemo } from '../lib/demo'
import { download, sessionsCSV } from '../lib/export'
import { navigate } from '../lib/router'
import { clearDemo, exportJSON, getData, importJSON, replaceAll, useData } from '../lib/store'

export function DataScreen() {
  const data = useData()
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [confirmWipe, setConfirmWipe] = useState(false)
  const hasDemo = data.athletes.some((a) => a.demo)
  const stamp = new Date().toISOString().slice(0, 10)

  return (
    <div>
      <TopBar back="" title="Data" />
      <h1 className="rise text-[28px] font-bold tracking-tight">Your data</h1>
      <p className="mt-1 text-[15px] text-muted">
        {data.athletes.length} athletes · {data.sessions.filter((s) => s.completedAt).length} sessions, stored only on this device.
      </p>

      <SectionTitle className="mt-6">Backup & move to another phone</SectionTitle>
      <Card className="grid gap-3 p-4">
        <Button variant="secondary" onClick={() => download(`baseline-backup-${stamp}.json`, exportJSON(), 'application/json')}>
          <Icon name="download" size={18} /> Export backup (.json)
        </Button>
        <Button variant="secondary" onClick={() => file.current?.click()}>
          <Icon name="upload" size={18} /> Import backup
        </Button>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            try {
              importJSON(await f.text())
              setMsg('Imported. Existing athletes were kept and new ones added.')
            } catch (err) {
              setMsg(`Couldn’t import: ${(err as Error).message}`)
            }
            e.target.value = ''
          }}
        />
        {msg && <p className="text-sm text-muted">{msg}</p>}
      </Card>

      <SectionTitle className="mt-6">Research export</SectionTitle>
      <Card className="p-4">
        <p className="mb-3 text-sm text-muted">
          One row per session with every score. Athletes are anonymized as A01, A02, … Use it with{' '}
          <code className="rounded bg-surface-2 px-1">scripts/analyze_reliability.py</code> to measure test-retest reliability.
        </p>
        <Button variant="secondary" className="w-full" onClick={() => download(`baseline-sessions-${stamp}.csv`, sessionsCSV(getData()), 'text/csv')}>
          <Icon name="download" size={18} /> Export anonymized CSV
        </Button>
      </Card>

      <SectionTitle className="mt-6">Demo team</SectionTitle>
      <Card className="p-4">
        {hasDemo ? (
          <Button variant="secondary" className="w-full" onClick={() => { clearDemo(); setMsg('Demo team removed.') }}>
            Remove demo athletes
          </Button>
        ) : (
          <Button variant="secondary" className="w-full" onClick={() => { loadDemo(); navigate('/') }}>
            Load demo team
          </Button>
        )}
      </Card>

      <SectionTitle className="mt-6">Danger zone</SectionTitle>
      <Card className="p-4">
        {confirmWipe ? (
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmWipe(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={() => { replaceAll({ version: 1, athletes: [], sessions: [] }); navigate('/', true) }}>
              Erase everything
            </Button>
          </div>
        ) : (
          <Button variant="ghost" className="w-full text-danger" onClick={() => setConfirmWipe(true)}>
            <Icon name="trash" size={18} /> Erase all data on this device
          </Button>
        )}
      </Card>
      <div className="h-10" />
    </div>
  )
}
