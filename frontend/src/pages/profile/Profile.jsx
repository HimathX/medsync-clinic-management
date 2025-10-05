import { useEffect, useMemo, useState } from 'react'
import './profile.css'
import TabNavigation from './TabNavigation.jsx'
import FormSection from './FormSection.jsx'
import SaveIndicator from './SaveIndicator.jsx'
import ProfilePhotoUpload from './ProfilePhotoUpload.jsx'

function PlaceholderForm({ title }) {
  const [state, setState] = useState('idle')
  return (
    <FormSection title={title} description="This section will be implemented next.">
      <div className="grid two">
        <label className="field">
          <input placeholder=" " />
          <span>Sample field</span>
        </label>
        <label className="field">
          <input placeholder=" " />
          <span>Another field</span>
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="primary" onClick={() => setState('saving')}>Save</button>
        <SaveIndicator state={state} />
      </div>
    </FormSection>
  )
}

export default function Profile() {
  const tabs = useMemo(() => [
    { key: 'personal', label: 'Personal Info' },
    { key: 'contacts', label: 'Emergency Contacts' },
    { key: 'insurance', label: 'Insurance' },
    { key: 'history', label: 'Medical History' },
    { key: 'security', label: 'Security' },
  ], [])

  const [active, setActive] = useState('personal')

  useEffect(() => {
    document.title = 'Profile • MedSync'
  }, [])

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div>
          <h2>My Profile</h2>
          <p className="muted">Manage your personal details and security settings</p>
        </div>
      </div>

      <div className="profile-content">
        <aside className="profile-sidebar">
          <ProfilePhotoUpload />
        </aside>
        <main className="profile-main">
          <TabNavigation tabs={tabs} activeKey={active} onChange={setActive} />

          <div className={`tab-panels ${active}`}>
            {active === 'personal' && <PlaceholderForm title="Personal Information" />}
            {active === 'contacts' && <PlaceholderForm title="Emergency Contacts" />}
            {active === 'insurance' && <PlaceholderForm title="Insurance Information" />}
            {active === 'history' && <PlaceholderForm title="Medical History" />}
            {active === 'security' && <PlaceholderForm title="Security Settings" />}
          </div>
        </main>
      </div>
    </div>
  )
}


