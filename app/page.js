"use client"

// -----------------------------
// IMPORTS
// -----------------------------
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'


export default function Home() {

  // -----------------------------
  // STATE
  // -----------------------------
  const [parameters, setParameters] = useState([])   // dropdown options Parmaeter
  const [tissue, setTissue] = useState([])   // dropdown options Tissue
  const [selectedParam, setSelectedParam] = useState('') // selected parameter ID
  const [selectedTissue, setSelectedTissue] = useState('') // selected Tissue ID
  const [result, setResult] = useState(null)         // query results


  // -----------------------------
  // FETCH PARAMETERS (ON LOAD)
  // -----------------------------
  const fetchParameters = async () => {
    const { data, error } = await supabase
      .from('parameter')
      .select('id, name')

    if (error) {
      console.error(error)
      return
    }

    setParameters(data)
  }

  useEffect(() => {
    fetchParameters()
  }, [])

  // -----------------------------
  // FETCH Tissues (ON LOAD)
  // -----------------------------
  const fetchTissue = async () => {
    const { data, error } = await supabase
      .from('tissue')
      .select('id, name')

    if (error) {
      console.error(error)
      return
    }

    setTissue(data)
  }

  useEffect(() => {
    fetchTissue()
  }, [])


  // -----------------------------
  // QUERY FUNCTION
  // -----------------------------
  const handleQuery = async () => {
    if (!selectedParam) return

    let query = supabase
      .from('observation')
      .select(`
        units,
        parameter(name),
        tissue(name),
        measurement_agg(mean, sd, min, max, n)
      `)
      .eq('parameter_id', Number(selectedParam))

    // Apply tissue filter if selected
    if (selectedTissue) {
      query = query.eq('tissue_id', Number(selectedTissue))
    }

    const { data, error } = await query

    if (error) {
      console.error(error)
      return
    }

    setResult(data)
  }


  // -----------------------------
  // UI
  // -----------------------------
  return (
    <main style={{ padding: '20px' }}>

      {/* HEADER */}
      <h1>OcuBase</h1>

      <nav>
        <Link href="/submit">Submit</Link> |{" "}
        <Link href="/analytics">Analytics</Link>
      </nav>

      <hr />

      {/* QUERY SECTION */}
      <h2>Quick Reference</h2>

      {/* DROPDOWN */}
      <select
        value={selectedParam}
        onChange={(e) => setSelectedParam(e.target.value)}
      >
        <option value="">Select parameter</option>

        {parameters.map((param) => (
          <option key={param.id} value={param.id}>
            {param.name}
          </option>
        ))}
      </select>
      <select
        value={selectedTissue}
        onChange={(e) => setSelectedTissue(e.target.value)}
      >
        <option value="">Select Tissue</option>

        {tissue.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <button onClick={handleQuery}>Get Reference Values</button>


      {/* RESULTS */}
      {result && (
        <div style={{ marginTop: '20px' }}>
          {result.map((item, i) => (
            <div key={i}>
              <h3>{item.parameter?.name}</h3>

              {item.measurement_agg?.[0] && (
                <>
                  <p>
                    Mean: {item.measurement_agg[0].mean} {item.units}
                  </p>
                  <p>SD: {item.measurement_agg[0].sd}</p>
                  <p>
                    Range: {item.measurement_agg[0].min} – {item.measurement_agg[0].max}
                  </p>
                  <p>n: {item.measurement_agg[0].n}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}