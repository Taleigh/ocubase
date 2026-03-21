"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Submit() {

  // -----------------------------
  // DATA
  // -----------------------------
  const [parameters, setParameters] = useState([])
  const [tissues, setTissues] = useState([])
  const [sources, setSources] = useState([])
  const [methods, setMethods] = useState([])
  const [context, setContext] = useState([])
  const [conditions, setConditions] = useState([])
  const [ageRanges, setAgeRanges] = useState([])

  // -----------------------------
  // FORM
  // -----------------------------
  const [form, setForm] = useState({
    parameter_id: '',
    tissue_id: '',
    source_id: '',
    method_type: '',
    measurement_context: '',
    units: '',
    age_range: '',
    sex: '',
    health_status: '',
    health_condition: '',
    mean: '',
    sd: '',
    min: '',
    max: '',
    n: ''
  })

  // -----------------------------
  // RAW / AGG
  // -----------------------------
  const [measurementType, setMeasurementType] = useState('agg')
  const [rawData, setRawData] = useState([{ value: '', condition: '', notes: '' }])

  const [loading, setLoading] = useState(false)

  // -----------------------------
  // FETCH
  // -----------------------------
  useEffect(() => {
    const fetchData = async () => {
      const { data: p } = await supabase.from('parameter').select('*')
      const { data: t } = await supabase.from('tissue').select('*')
      const { data: s } = await supabase.from('source').select('*')
      const { data: o } = await supabase.from('observation').select('method_type, measurement_context, health_condition, age_range')

      const uniqueMethods = [
        ...new Set((o || []).map(x => x.method_type).filter(Boolean))
      ]
      const uniqueContext = [
        ...new Set((o || []).map(x => x.measurement_context).filter(Boolean))
      ]
      const uniqueConditions = [
        ...new Set((o || []).map(x => x.health_condition).filter(Boolean))
      ]

      const uniqueAgeRanges = [
        ...new Set((o || []).map(x => x.age_range).filter(Boolean))
      ]

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

  // -----------------------------
  // HANDLERS
  // -----------------------------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const updateRawRow = (i, field, value) => {
    const updated = [...rawData]
    updated[i][field] = value
    setRawData(updated)
  }

  const addRow = () => {
    setRawData([...rawData, { value: '', condition: '', notes: '' }])
  }

  const validate = () => {
    if (!form.source_id) return alert("Source required"), false
    if (!form.parameter_id || !form.tissue_id) return alert("Parameter & Tissue required"), false

    if (measurementType === 'agg' && (!form.mean || isNaN(form.mean)))
      return alert("Mean required"), false

    return true
  }

// -----------------------------
// SUBMIT
// -----------------------------
const handleSubmit = async () => {
  if (!validate()) return

  setLoading(true)

  try {
    // -----------------------------
    // 1. CREATE OBSERVATION
    // -----------------------------
    const { data, error: obsError } = await supabase
      .from('observation')
      .insert([{
        parameter_id: Number(form.parameter_id),
        tissue_id: Number(form.tissue_id),
        source_id: Number(form.source_id),

        method_type: form.method_type,
        measurement_context: form.measurement_context,

        age_range: form.age_range,
        sex: form.sex,
        health_status: form.health_status,
        health_condition: form.health_condition,

        units: form.units
      }])
      .select()

    if (obsError) throw obsError

    const observationId = data[0].id

    // -----------------------------
    // 2. AGGREGATED DATA
    // -----------------------------
    if (measurementType === 'agg') {
      const { error: aggError } = await supabase
        .from('measurement_agg')
        .insert([{
          observation_id: observationId,
          mean: Number(form.mean),
          sd: form.sd ? Number(form.sd) : null,
          min: form.min ? Number(form.min) : null,
          max: form.max ? Number(form.max) : null,
          n: form.n ? Number(form.n) : null
        }])

      if (aggError) throw aggError
    }

    // -----------------------------
    // 3. RAW DATA (WITH SAMPLE LAYER)
    // -----------------------------
    if (measurementType === 'raw') {

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i]

        if (!row.value) continue // skip empty rows

        // --- create sample ---
        const { data: sampleData, error: sampleError } = await supabase
          .from('sample')
          .insert([{
            observation_id: observationId,
            label: `Sample ${i + 1}`
          }])
          .select()

        if (sampleError) throw sampleError

        const sampleId = sampleData[0].id

        // --- insert measurement ---
        const { error: measError } = await supabase
          .from('measurement_raw')
          .insert([{
            sample_id: sampleId,
            value: Number(row.value)
          }])

        if (measError) throw measError
      }
    }

    alert("✅ Submitted successfully")

  } catch (err) {
    console.error(err)
    alert("❌ Submission failed")
  }

  setLoading(false)
}

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <main style={{ padding: 30, maxWidth: 700, margin: 'auto' }}>

      <h1>Submit Data</h1>

      {/* SOURCE */}
      <SearchSelect
        label="Source"
        data={sources}
        display={(s) => s.doi || s.title}
        value={form.source_id}
        onSelect={(id) => setForm({ ...form, source_id: id })}
      />

      {/* OBSERVATION */}
      <div style={card}>
        <h3>Observation</h3>

        <SearchSelect
          label="Parameter"
          data={parameters}
          display={(p) => p.name}
          value={form.parameter_id}
          onSelect={(id) => setForm({ ...form, parameter_id: id })}
        />

        <SearchSelect
          label="Tissue"
          data={tissues}
          display={(t) => t.name}
          value={form.tissue_id}
          onSelect={(id) => setForm({ ...form, tissue_id: id })}
        />

        <SearchSelect
          label="Method"
          data={methods}
          display={(m) => m}
          value={form.method_type}
          onSelect={(val) => setForm({ ...form, method_type: val })}
        />

        <SearchSelect
          label="Context"
          data={context}
          display={(c) => c}
          value={form.measurement_context}
          onSelect={(val) => setForm({ ...form, measurement_context: val })}
        />

        <SearchSelect
          label="Age Range"
          data={ageRanges}
          display={(a) => a}
          value={form.age_range}
          onSelect={(val) => setForm({ ...form, age_range: val })}
        />

        <select name="sex" value={form.sex} onChange={handleChange}>
          <option value="">Select sex</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="mixed">Mixed</option>
          <option value="unknown">Unknown</option>
        </select>

        <select name="health_status" value={form.health_status} onChange={handleChange}>
          <option value="">Health status</option>
          <option value="healthy">Healthy</option>
          <option value="diseased">Diseased</option>
          <option value="mixed">Mixed</option>
        </select>

        <SearchSelect
          label="Health Condition"
          data={conditions}
          display={(c) => c}
          value={form.health_condition}
          onSelect={(val) => setForm({ ...form, health_condition: val })}
        />

        <select name="units" value={form.units} onChange={handleChange}>
          <option value="">Select units</option>
          <option value="µm">µm</option>
          <option value="mm">mm</option>
          <option value="cm">cm</option>
        </select>
      </div>

      {/* TYPE */}
      <div style={card}>
        <label>
          <input type="radio" checked={measurementType === 'agg'} onChange={() => setMeasurementType('agg')} />
          Aggregated
        </label>
        <label>
          <input type="radio" checked={measurementType === 'raw'} onChange={() => setMeasurementType('raw')} />
          Raw
        </label>
      </div>

      {/* AGG */}
      {measurementType === 'agg' && (
        <div style={card}>
          <input name="mean" placeholder="Mean" onChange={handleChange} />
          <input name="sd" placeholder="SD" onChange={handleChange} />
          <input name="min" placeholder="Min" onChange={handleChange} />
          <input name="max" placeholder="Max" onChange={handleChange} />
          <input name="n" placeholder="n" onChange={handleChange} />
        </div>
      )}

      {/* RAW */}
      {measurementType === 'raw' && (
        <div style={card}>
          {rawData.map((r, i) => (
            <div key={i}>
              <input
                placeholder="Value"
                onChange={e => updateRawRow(i, 'value', e.target.value)}
              />
            </div>
          ))}
          <button onClick={addRow}>+ Add Row</button>
        </div>
      )}

      <button onClick={handleSubmit}>
        {loading ? "Submitting..." : "Submit"}
      </button>

    </main>
  )
}

// -----------------------------
// REUSABLE SEARCH COMPONENT
// -----------------------------
function SearchSelect({ label, data, display, value, onSelect }) {
  const [search, setSearch] = useState('')

  const filtered = data.filter(d =>
    display(d).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={card}>
      <h3>{label}</h3>

      <input
        placeholder={`Search ${label}`}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)

          // allow typing new values for string-based fields
          if (typeof data[0] === "string") {
            onSelect(e.target.value)
          }
        }}
      />

      <div style={{ maxHeight: 150, overflowY: 'auto' }}>
        {filtered.map((d, i) => (
          <div
            key={d.id || i}
            onClick={() => onSelect(d.id || d)}
            style={{
              padding: 8,
              cursor: 'pointer',
              background: value === (d.id || d) ? '#006c12' : 'white'
            }}
          >
            {display(d)}
          </div>
        ))}
      </div>
    </div>
  )
}

// -----------------------------
const card = {
  border: '1px solid #ddd',
  padding: 20,
  marginBottom: 20,
  borderRadius: 10
}