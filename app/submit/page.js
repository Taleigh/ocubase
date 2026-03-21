"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Submit() {

  const [parameters, setParameters] = useState([])
  const [tissues, setTissues] = useState([])
  const [sources, setSources] = useState([])
  const [methods, setMethods] = useState([])
  const [context, setContext] = useState([])
  const [conditions, setConditions] = useState([])
  const [ageRanges, setAgeRanges] = useState([])
  const [measurementType, setMeasurementType] = useState('agg')
  const [loading, setLoading] = useState(false)

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

  useEffect(() => {
    const fetchData = async () => {

      const { data: p } = await supabase.from('parameter').select('*')
      const { data: t } = await supabase.from('tissue').select('*')
      const { data: s } = await supabase.from('source').select('*')
      const { data: o } = await supabase.from('observation').select('*')

      const uniqueMethods = [...new Set((o || []).map(x => x.method_type).filter(Boolean))]
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
    }

    fetchData()
  }, [])

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
      health_condition: '',
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
      health_condition: '',
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
    const { data, error } = await supabase.from('parameter').insert([{ name }]).select()
    if (error) return console.error(error)

    setParameters([...parameters, data[0]])
    setForm({ ...form, parameter_id: data[0].id })
  }

  const handleAddTissue = async (name) => {
    const { data, error } = await supabase.from('tissue').insert([{ name }]).select()
    if (error) return console.error(error)

    setTissues([...tissues, data[0]])
    setForm({ ...form, tissue_id: data[0].id })
  }

  const handleAddSource = async (name) => {
    const { data, error } = await supabase.from('source').insert([{ title: name }]).select()
    if (error) return console.error(error)

    setSources([...sources, data[0]])
    setForm({ ...form, source_id: data[0].id })
  }

  const handleAddMethod = async (name) => {
    setMethods([...methods, name])
    setForm({ ...form, method_type: name })
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
              health_condition: c.health_condition,
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
              health_condition: row.health_condition,
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

  return (
    <main style={{ padding: 30, maxWidth: 700, margin: 'auto' }}>

      <h1>Submit Data</h1>

      <SearchSelect label="Source" data={sources}
        display={(s) => s.doi || s.title}
        value={form.source_id}
        onSelect={(id) => setForm({ ...form, source_id: id })}
        onAddNew={handleAddSource}
      />

      <div style={card}>
        <h3>Observation</h3>

        <SearchSelect label="Parameter" data={parameters}
          display={(p) => p.name}
          value={form.parameter_id}
          onSelect={(id) => setForm({ ...form, parameter_id: id })}
          onAddNew={handleAddParameter}
        />

        <SearchSelect label="Tissue" data={tissues}
          display={(t) => t.name}
          value={form.tissue_id}
          onSelect={(id) => setForm({ ...form, tissue_id: id })}
          onAddNew={handleAddTissue}
        />

        <SearchSelect label="Method" data={methods}
          display={(m) => m}
          value={form.method_type}
          onSelect={(val) => setForm({ ...form, method_type: val })}
          onAddNew={handleAddMethod}
        />

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
                      <InlineSearchSelect
                        value={c.health_condition}
                        data={conditions}
                        onSelect={(val) => updateCohort(i, 'health_condition', val)}
                      />
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
                    <input
                      value={row.health_condition || ''}
                      onChange={e => updateRawRow(i, 'health_condition', e.target.value)}
                    />
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

    </main>
  )
}

// components unchanged ↓
function SearchSelect({ label, data, display, value, onSelect, onAddNew }) {
  const [search, setSearch] = useState('')

  const filtered = data.filter(d =>
    display(d).toLowerCase().includes(search.toLowerCase())
  )

  const showAdd = search && filtered.length === 0 && onAddNew

  return (
    <div style={card}>
      <h3>{label}</h3>

      <input placeholder={`Search ${label}`}
        value={search}
        onChange={(e) => setSearch(e.target.value)} />

      {filtered.map(d => (
        <div key={d.id || d}
          onClick={() => onSelect(d.id || d)}>
          {display(d)}
        </div>
      ))}

      {showAdd && (
        <div onClick={() => onAddNew(search)}>
          ➕ Add "{search}"
        </div>
      )}
    </div>
  )
}

function InlineSearchSelect({ value, data, onSelect }) {
  const [search, setSearch] = useState(value || '')
  const [open, setOpen] = useState(false)

  const filtered = data.filter(d =>
    d.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={search}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value)
          onSelect(e.target.value)
        }}
        placeholder="Condition"
      />

      {open && (
        <div style={{
          position: 'absolute',
          background: 'white',
          border: '1px solid #ccc',
          zIndex: 10,
          maxHeight: 120,
          overflowY: 'auto',
          width: '100%'
        }}>
          {filtered.map((item, i) => (
            <div
              key={i}
              onClick={() => {
                setSearch(item)
                onSelect(item)
                setOpen(false)
              }}
              style={{ padding: 5, cursor: 'pointer' }}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
const numInput = { width: '70px' }