"use client"

// -----------------------------
// IMPORTS
// -----------------------------
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'


export default function Submit() {

  // -----------------------------
  // DROPDOWN DATA
  // -----------------------------
  const [parameters, setParameters] = useState([])
  const [tissues, setTissues] = useState([])

  // -----------------------------
  // FORM STATE
  // -----------------------------
  const [form, setForm] = useState({
    parameter_id: '',
    tissue_id: '',
    method_type: '',
    measurement_context: '',
    units: '',
    mean: '',
    sd: '',
    min: '',
    max: '',
    n: ''
  })


  // -----------------------------
  // FETCH DROPDOWNS
  // -----------------------------
  useEffect(() => {
    const fetchData = async () => {
      const { data: paramData } = await supabase.from('parameter').select('id, name')
      const { data: tissueData } = await supabase.from('tissue').select('id, name')

      setParameters(paramData || [])
      setTissues(tissueData || [])
    }

    fetchData()
  }, [])


  // -----------------------------
  // INPUT HANDLER
  // -----------------------------
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }


  // -----------------------------
  // SUBMIT FUNCTION
  // -----------------------------
  const handleSubmit = async () => {

    try {

      // -----------------------------
      // 1. INSERT OBSERVATION
      // -----------------------------
      const { data: obsData, error: obsError } = await supabase
        .from('observation')
        .insert([
          {
            parameter_id: Number(form.parameter_id),
            tissue_id: Number(form.tissue_id),
            source_id: 1, // placeholder for now
            method_type: form.method_type,
            measurement_context: form.measurement_context,
            units: form.units
          }
        ])
        .select()

      if (obsError) throw obsError

      const observationId = obsData[0].id


      // -----------------------------
      // 2. INSERT MEASUREMENT
      // -----------------------------
      const { error: measError } = await supabase
        .from('measurement_agg')
        .insert([
          {
            observation_id: observationId,
            mean: Number(form.mean),
            sd: Number(form.sd),
            min: Number(form.min),
            max: Number(form.max),
            n: Number(form.n)
          }
        ])

      if (measError) throw measError


      alert('✅ Data successfully submitted!')

    } catch (err) {
      console.error(err)
      alert('❌ Error submitting data')
    }
  }


  // -----------------------------
  // UI
  // -----------------------------
  return (
    <main style={{ padding: '20px' }}>
      <h1>Submit Data</h1>

      <nav>
        <Link href="/">Home</Link> |{" "}
        <Link href="/analytics">Analytics</Link>
      </nav>

      <hr />

      <h2>New Observation</h2>

      {/* PARAMETER */}
      <p>Parameter:</p>
      <select name="parameter_id" onChange={handleChange}>
        <option value="">Select</option>
        {parameters.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {/* TISSUE */}
      <p>Tissue:</p>
      <select name="tissue_id" onChange={handleChange}>
        <option value="">Select</option>
        {tissues.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      {/* METHOD */}
      <input name="method_type" placeholder="Method (e.g. OCT)" onChange={handleChange} />

      {/* CONTEXT */}
      <input name="measurement_context" placeholder="Context (in vivo / ex vivo)" onChange={handleChange} />

      {/* UNITS */}
      <input name="units" placeholder="Units (e.g. µm)" onChange={handleChange} />

      <hr />

      <h2>Measurement (Summary)</h2>

      <input name="mean" placeholder="Mean" onChange={handleChange} />
      <input name="sd" placeholder="SD" onChange={handleChange} />
      <input name="min" placeholder="Min" onChange={handleChange} />
      <input name="max" placeholder="Max" onChange={handleChange} />
      <input name="n" placeholder="Sample size (n)" onChange={handleChange} />

      <br /><br />

      <button onClick={handleSubmit}>Submit</button>
    </main>
  )
}