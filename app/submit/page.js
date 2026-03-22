"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Submit() {
  // States ----------------------------------------------------------------
  const [parameters, setParameters] = useState([])
  const [tissues, setTissues] = useState([])
  const [sources, setSources] = useState([])
  const [methods, setMethods] = useState([])
  const [context, setContext] = useState([])
  const [conditions, setConditions] = useState([])
  const [ageRanges, setAgeRanges] = useState([])
  const [measurementType, setMeasurementType] = useState('agg')
  const [loading, setLoading] = useState(false)
  const [healthConditions, setHealthConditions] = useState([])
  const [form, setForm] = useState({
    parameter_id: '',
    tissue_id: '',
    source_id: '',
    method_type: '',
    measurement_context: '',
    units: ''
  })
  const [cohorts, setCohorts] = useState([
    {
      label: '',
      age_range: '',
      sex: '',
      health_status: '',
      health_condition: '',
      n: '',
      mean: '',
      sd: '',
      min: '',
      max: ''
    }
  ])
  const [rawData, setRawData] = useState([
    {
      value: '',
      sex: '',
      health_status: '',
      health_condition: '',
      age_range: ''
    }
  ])
  const [showSourceForm, setShowSourceForm] = useState(false)
  const [sourceDraft, setSourceDraft] = useState({
  title: '',
  doi: '',
  journal: '',
  year: ''
  })
  const [showAddParameter, setShowAddParameter] = useState(false)
  const [newParameter, setNewParameter] = useState('')
  const [showAddTissue, setShowAddTissue] = useState(false)
  const [newTissue, setNewTissue] = useState('')
  const [showAddMethod, setShowAddMethod] = useState(false)
  const [newMethod, setNewMethod] = useState('')
  const [showAddCondition, setShowAddCondition] = useState(false)
  const [newCondition, setNewCondition] = useState('')

  // Fetch Data ----------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {

      const { data: p } = await supabase.from('parameter').select('*')
      const { data: t } = await supabase.from('tissue').select('*')
      const { data: s } = await supabase.from('source').select('*')
      const { data: o } = await supabase.from('observation').select('*')
      const { data: hc } = await supabase.from('health_condition').select('*')

      const uniqueMethods = [...new Set((o || []).map(x => x.method_type).filter(Boolean))]
        .map(m => ({ id: m, name: m }))
      const uniqueContext = [...new Set((o || []).map(x => x.measurement_context).filter(Boolean))]
      const uniqueConditions = [...new Set((o || []).map(x => x.health_condition).filter(Boolean))]
      const uniqueAgeRanges = [...new Set((o || []).map(x => x.age_range).filter(Boolean))]

      setParameters(p || [])
      setTissues(t || [])
      setSources(s || [])
      setMethods(uniqueMethods)
      setContext(uniqueContext)
      setConditions(uniqueConditions)
      setAgeRanges(uniqueAgeRanges)
      setHealthConditions(hc || [])
    }

    fetchData()
  }, [])

  // Handlers ----------------------------------------------------------------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const updateRawRow = (i, field, value) => {
    const updated = [...rawData]
    updated[i][field] = value
    setRawData(updated)
  }

  const addRow = () => {
    setRawData([...rawData, {
      value: '',
      sex: '',
      health_status: '',
      health_condition_id: '', // ✅ FIXED
      age_range: ''
    }])
  }

  const updateCohort = (i, field, value) => {
    const updated = [...cohorts]
    updated[i][field] = value
    setCohorts(updated)
  }

  const addCohort = () => {
    setCohorts([...cohorts, {
      label: '',
      age_range: '',
      sex: '',
      health_status: '',
      health_condition_id: '', // ✅ FIXED
      n: '',
      mean: '',
      sd: '',
      min: '',
      max: ''
    }])
  }

  const duplicateCohort = (index) => {
    const copy = { ...cohorts[index] }
    setCohorts([
      ...cohorts.slice(0, index + 1),
      copy,
      ...cohorts.slice(index + 1)
    ])
  }

  const handleAddParameter = async (name) => {
    const { data, error } = await supabase
      .from('parameter')
      .insert([{ name }])
      .select()

    if (error) throw error

    const newItem = data[0]

    setParameters(prev => [...prev, newItem])
    setForm(prev => ({ ...prev, parameter_id: newItem.id }))

    return newItem // ✅ ADD THIS
  }

  const handleAddTissue = async (name) => {
    const { data, error } = await supabase
      .from('tissue')
      .insert([{ name }])
      .select()

    if (error) throw error

    const newItem = data[0]

    setTissues(prev => [...prev, newItem])
    setForm(prev => ({ ...prev, tissue_id: newItem.id }))

    return newItem // ✅
  }

  const handleAddSource = async (name) => {
    const { data, error } = await supabase
      .from('source')
      .insert([{ title: name }])
      .select()

    if (error) throw error

    const newItem = data[0]

    setSources(prev => [...prev, newItem])
    setForm(prev => ({ ...prev, source_id: newItem.id }))

    return newItem // ✅
  }

  const handleAddMethod = async (name) => {
    const newItem = { id: name, name }

    setMethods(prev => [...prev, newItem])
    setForm(prev => ({ ...prev, method_type: name }))

    return newItem
  }

  const validate = () => {
    if (!form.source_id) return alert("Source required"), false
    if (!form.parameter_id || !form.tissue_id) return alert("Parameter & Tissue required"), false

    if (measurementType === 'agg') {
      const hasValid = cohorts.some(c => c.mean)
      if (!hasValid) return alert("At least one cohort with mean required"), false
    }

    return true
  }

  const toNumber = (val) => val ? Number(val) : null

  const handleAddHealthCondition = async (name) => {
    const { data, error } = await supabase
      .from('health_condition')
      .insert([{ name }])
      .select()

    if (error) throw error

    const newItem = data[0]

    setHealthConditions(prev => [...prev, newItem])

    return newItem
  }

  const handleSaveSource = async () => {
    try {
      const { data, error } = await supabase
        .from('source')
        .insert([{
          title: sourceDraft.title,
          doi: sourceDraft.doi,
          journal: sourceDraft.journal,
          year: sourceDraft.year ? Number(sourceDraft.year) : null
        }])
        .select()

      if (error) throw error

      const newItem = data[0]

      // update local state
      setSources(prev => [...prev, newItem])

      // auto-select it in the form
      setForm(prev => ({
        ...prev,
        source_id: newItem.id
      }))

      // close modal
      setShowSourceForm(false)

    } catch (err) {
      console.error(err)
      alert("Failed to save source")
    }
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)

    try {
      const { data, error } = await supabase.from('observation').insert([{
        parameter_id: Number(form.parameter_id),
        tissue_id: Number(form.tissue_id),
        source_id: Number(form.source_id),
        method_type: form.method_type,
        measurement_context: form.measurement_context,
        units: form.units
      }]).select()

      if (error) throw error

      const observationId = data[0].id

      // AGG
      if (measurementType === 'agg') {

        for (let c of cohorts) {
          if (!c.mean) continue

          const { data: cohortData, error: cohortError } = await supabase
            .from('cohort')
            .insert([{
              observation_id: observationId,
              label: c.label,
              age_range: c.age_range,
              sex: c.sex,
              health_status: c.health_status,
              health_condition_id: c.health_condition_id || null,
              n: toNumber(c.n)
            }])
            .select()

          if (cohortError) throw cohortError

          const cohortId = cohortData[0].id

          const { error: aggError } = await supabase.from('measurement_agg').insert([{
            cohort_id: cohortId,
            mean: toNumber(c.mean),
            sd: toNumber(c.sd),
            min: toNumber(c.min),
            max: toNumber(c.max)
          }])

          if (aggError) throw aggError
        }
      }

      // RAW
      if (measurementType === 'raw') {
 
        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i]
          if (!row.value) continue

          const { data: sampleData, error: sampleError } = await supabase
            .from('sample')
            .insert([{
              observation_id: observationId,
              label: `Sample ${i + 1}`,
              sex: row.sex,
              health_status: row.health_status,
              health_condition_id: row.health_condition_id || null,
              age_range: row.age_range
            }])
            .select()

          if (sampleError) throw sampleError

          const sampleId = sampleData[0].id

          const { error: rawError } = await supabase.from('measurement_raw').insert([{
            sample_id: sampleId,
            value: toNumber(row.value)
          }])

          if (rawError) throw rawError
        }
      }

      alert("✅ Submitted successfully")

    } catch (err) {
      console.error(err)
      alert("❌ Submission failed")
    }

    setLoading(false)
  }


  // User Interface ----------------------------------------------------------------
  return (
    <main style={{ padding: 30, maxWidth: 700, margin: 'auto' }}>

      <h1>Submit Data</h1>

      <SearchSelect label="Source" data={sources}
        display={(s) => s.doi || s.title}
        value={form.source_id}
        onSelect={(id) => setForm({ ...form, source_id: id })}
        onAddNew={handleAddSource}
      />
      <button onClick={() => {
        setSourceDraft({
          title: '',
          doi: '',
          journal: '',
          year: ''
        })
        setShowSourceForm(true)
      }}>
        ➕ Add New Source
      </button>

      <div style={card}>
        <h3>Observation</h3>

        <SearchSelect label="Parameter" data={parameters}
          display={(p) => p.name}
          value={form.parameter_id}
          onSelect={(id) => setForm({ ...form, parameter_id: id })}
          onAddNew={handleAddParameter}
        />
        <button onClick={() => setShowAddParameter(true)}>
          ➕ Add Parameter
        </button>

        {showAddParameter && (
          <div style={{ marginTop: 10 }}>
            <input
              placeholder="New parameter"
              value={newParameter}
              onChange={(e) => setNewParameter(e.target.value)}
            />

            <button onClick={async () => {
              const item = await handleAddParameter(newParameter)
              setNewParameter('')
              setShowAddParameter(false)
            }}>
              Save
            </button>

            <button onClick={() => setShowAddParameter(false)}>
              Cancel
            </button>
          </div>
        )}

        <SearchSelect label="Tissue" data={tissues}
          display={(t) => t.name}
          value={form.tissue_id}
          onSelect={(id) => setForm({ ...form, tissue_id: id })}
          onAddNew={handleAddTissue}
        />
        <button onClick={() => setShowAddTissue(true)}>
          ➕ Add Tissue
        </button>

        {showAddTissue && (
          <div style={{ marginTop: 10 }}>
            <input
              placeholder="New tissue"
              value={newTissue}
              onChange={(e) => setNewTissue(e.target.value)}
              autoFocus
            />

            <button onClick={async () => {
              await handleAddTissue(newTissue)
              setNewTissue('')
              setShowAddTissue(false)
            }}>
              Save
            </button>

            <button onClick={() => setShowAddTissue(false)}>
              Cancel
            </button>
          </div>
        )}

        <SearchSelect label="Method" data={methods}
          display={(m) => m.name}
          value={form.method_type}
          onSelect={(val) => setForm({ ...form, method_type: val })}
          onAddNew={handleAddMethod}
        />
        <button onClick={() => setShowAddMethod(true)}>
          ➕ Add Method
        </button>

        {showAddMethod && (
          <div style={{ marginTop: 10 }}>
            <input
              placeholder="New method"
              value={newMethod}
              onChange={(e) => setNewMethod(e.target.value)}
              autoFocus
            />

            <button onClick={async () => {
              await handleAddMethod(newMethod)
              setNewMethod('')
              setShowAddMethod(false)
            }}>
              Save
            </button>

            <button onClick={() => setShowAddMethod(false)}>
              Cancel
            </button>
          </div>
        )}

        <SearchSelect label="Context" data={context}
          display={(c) => c}
          value={form.measurement_context}
          onSelect={(val) => setForm({ ...form, measurement_context: val })}
        />

        <select name="units" value={form.units} onChange={handleChange}>
          <option value="">Units</option>
          <option value="µm">µm</option>
          <option value="mm">mm</option>
          <option value="cm">cm</option>
        </select>
      </div>

      <div style={card}>
        <label><input type="radio" checked={measurementType === 'agg'} onChange={() => setMeasurementType('agg')} /> Aggregated</label>
        <label><input type="radio" checked={measurementType === 'raw'} onChange={() => setMeasurementType('raw')} /> Raw</label>
      </div>

      {measurementType === 'agg' && (
        <div style={card}>
          <h2>Cohorts</h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr>
                  <th style={th}>Label</th>
                  <th style={th}>Age</th>
                  <th style={th}>Sex</th>
                  <th style={th}>Health</th>
                  <th style={th}>Condition</th>
                  <th style={th}>n</th>
                  <th style={th}>Mean</th>
                  <th style={th}>SD</th>
                  <th style={th}>Min</th>
                  <th style={th}>Max</th>
                  <th style={th}></th>
                </tr>
              </thead>

              <tbody>
                {cohorts.map((c, i) => (
                  <tr key={i}>
                    <td style={td}>
                      <input value={c.label}
                        onChange={e => updateCohort(i, 'label', e.target.value)} />
                    </td>

                    <td style={td}>
                      <input value={c.age_range}
                        onChange={e => updateCohort(i, 'age_range', e.target.value)} />
                    </td>

                    <td style={td}>
                      <select value={c.sex}
                        onChange={e => updateCohort(i, 'sex', e.target.value)}>
                        <option value="">-</option>
                        <option value="male">M</option>
                        <option value="female">F</option>
                        <option value="mixed">Mix</option>
                      </select>
                    </td>

                    <td style={td}>
                      <select value={c.health_status}
                        onChange={e => updateCohort(i, 'health_status', e.target.value)}>
                        <option value="">-</option>
                        <option value="healthy">Healthy</option>
                        <option value="diseased">Diseased</option>
                      </select>
                    </td>

                    <td style={td}>
                      <SearchSelect
                        label=""
                        data={healthConditions}
                        display={(c) => c.name}
                        value={c.health_condition_id}
                        onSelect={(id) => updateCohort(i, 'health_condition_id', id)}
                        onAddNew={handleAddHealthCondition}
                      />
                      <button onClick={() => setShowAddCondition(true)}>
                        ➕ Add Condition
                      </button>

                      {showAddCondition && (
                        <div style={{ marginTop: 10 }}>
                          <input
                            placeholder="New condition"
                            value={newCondition}
                            onChange={(e) => setNewCondition(e.target.value)}
                            autoFocus
                          />

                          <button onClick={async () => {
                            await handleAddHealthCondition(newCondition)
                            setNewCondition('')
                            setShowAddCondition(false)
                          }}>
                            Save
                          </button>

                          <button onClick={() => setShowAddCondition(false)}>
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>

                    <td style={td}>
                      <input value={c.n}
                        onChange={e => updateCohort(i, 'n', e.target.value)} />
                    </td>

                    <td style={td}>
                      <input value={c.mean}
                        onChange={e => updateCohort(i, 'mean', e.target.value)} />
                    </td>

                    <td style={td}>
                      <input value={c.sd}
                        onChange={e => updateCohort(i, 'sd', e.target.value)} />
                    </td>

                    <td style={td}>
                      <input value={c.min}
                        onChange={e => updateCohort(i, 'min', e.target.value)} />
                    </td>

                    <td style={td}>
                      <input value={c.max}
                        onChange={e => updateCohort(i, 'max', e.target.value)} />
                    </td>

                    <td style={td}>
                      <button onClick={() => duplicateCohort(i)}>⧉</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={addCohort} style={{ marginTop: 10 }}>
            + Add Cohort
          </button>
        </div>
      )}

      {measurementType === 'raw' && (
        <div style={card}>
          <h2>Raw Data (Samples)</h2>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Value</th>
                <th style={th}>Sex</th>
                <th style={th}>Health</th>
                <th style={th}>Condition</th>
                <th style={th}>Age</th>
              </tr>
            </thead>

            <tbody>
              {rawData.map((row, i) => (
                <tr key={i}>

                  <td style={td}>
                    <input
                      value={row.value || ''}
                      onChange={e => updateRawRow(i, 'value', e.target.value)}
                    />
                  </td>

                  <td style={td}>
                    <select
                      value={row.sex || ''}
                      onChange={e => updateRawRow(i, 'sex', e.target.value)}>
                      <option value="">-</option>
                      <option value="male">M</option>
                      <option value="female">F</option>
                      <option value="mixed">Mix</option>
                    </select>
                  </td>

                  <td style={td}>
                    <select
                      value={row.health_status || ''}
                      onChange={e => updateRawRow(i, 'health_status', e.target.value)}>
                      <option value="">-</option>
                      <option value="healthy">Healthy</option>
                      <option value="diseased">Diseased</option>
                    </select>
                  </td>

                  <td style={td}>
                    <SearchSelect
                      label=""
                      data={healthConditions}
                      display={(c) => c.name}
                      value={row.health_condition_id}
                      onSelect={(id) => updateCohort(i, 'health_condition_id', id)}
                      onAddNew={handleAddHealthCondition}
                    />
                    <button onClick={() => setShowAddCondition(true)}>
                      ➕ Add Condition
                    </button>

                    {showAddCondition && (
                      <div style={{ marginTop: 10 }}>
                        <input
                          placeholder="New condition"
                          value={newCondition}
                          onChange={(e) => setNewCondition(e.target.value)}
                          autoFocus
                        />

                        <button onClick={async () => {
                          await handleAddHealthCondition(newCondition)
                          setNewCondition('')
                          setShowAddCondition(false)
                        }}>
                          Save
                        </button>

                        <button onClick={() => setShowAddCondition(false)}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>

                  <td style={td}>
                    <input
                      value={row.age_range || ''}
                      onChange={e => updateRawRow(i, 'age_range', e.target.value)}
                    />
                  </td>

                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={addRow}>+ Add Sample</button>
        </div>
      )}

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Submitting..." : "Submit"}
      </button>

      {showSourceForm && (
        <div style={modalOverlay}>
          <div style={modalCard}>

            <h2>Add Source</h2>

            <input
              placeholder="DOI"
              value={sourceDraft.doi}
              onChange={(e) =>
                setSourceDraft({ ...sourceDraft, doi: e.target.value })
              }
            />

            <input
              placeholder="Title"
              value={sourceDraft.title}
              onChange={(e) =>
                setSourceDraft({ ...sourceDraft, title: e.target.value })
              }
            />

            <input
              placeholder="Journal"
              value={sourceDraft.journal}
              onChange={(e) =>
                setSourceDraft({ ...sourceDraft, journal: e.target.value })
              }
            />

            <input
              placeholder="Year"
              value={sourceDraft.year}
              onChange={(e) =>
                setSourceDraft({ ...sourceDraft, year: e.target.value })
              }
            />

            <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
              <button onClick={handleSaveSource}>Save</button>
              <button onClick={() => setShowSourceForm(false)}>Cancel</button>
            </div>

          </div>
        </div>
      )}

    </main>
  )
}

// Reusable components ----------------------------------------------------------------
function SearchSelect({ label, data, display, value, onSelect }) {
  const [search, setSearch] = useState('')
  const [focused, setFocused] = useState(false)

  const selectedItem = data.find(d => d.id === value)

  const filtered = data.filter(d =>
    display(d).toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (item) => {
    onSelect(item.id)
    setSearch('')
    setFocused(false)
  }

  return (
    <div style={card}>
      {label && <h3>{label}</h3>}

      <input
        placeholder={`Search ${label}`}
        value={
          focused
            ? search
            : (selectedItem ? display(selectedItem) : '')
        }
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 100)}
        onChange={(e) => setSearch(e.target.value)}
      />

      {focused && (
        <div style={{
          marginTop: 5,
          border: '1px solid #ccc',
          borderRadius: 6,
          maxHeight: 150,
          overflowY: 'auto',
          background: 'white'
        }}>
          {filtered.map(d => (
            <div
              key={d.id}
              onClick={() => handleSelect(d)}
              style={{
                padding: 6,
                cursor: 'pointer',
                background: value === d.id ? '#e6ffe6' : 'transparent'
              }}
            >
              {display(d)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// Styling ----------------------------------------------------------------
const card = {
  border: '1px solid #00850f',
  padding: 20,
  marginBottom: 20,
  borderRadius: 10
}
const th = {
  borderBottom: '1px solid #00850f', 
  padding: '6px', 
  textAlign: 'left', 
  background: '#00850f' 
} 
const td = { 
  borderBottom: '1px solid #00850f', 
  padding: '4px' 
} 
const numInput = { 
  width: '70px' 
}

const addButton = {
  marginTop: 8,
  padding: '6px 10px',
  border: '1px solid #00850f',
  borderRadius: 6,
  background: '#e6ffe6',
  cursor: 'pointer'
}

const modalOverlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
}

const modalCard = {
  background: 'white',
  padding: 25,
  borderRadius: 12,
  width: 400,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
}