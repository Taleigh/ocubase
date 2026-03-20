"use client"

// -----------------------------
// IMPORTS
// -----------------------------
// Navigation + React state + Supabase client
import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '../lib/supabase'


export default function Home() {

  // -----------------------------
  // STATE MANAGEMENT
  // -----------------------------
  // Stores user input (parameter query)
  // Stores query results from database
  const [parameter, setParameter] = useState('')
  const [result, setResult] = useState(null)


  // -----------------------------
  // DATABASE QUERY FUNCTION
  // -----------------------------
  // Fetches baseline data based on user input
  const handleQuery = async () => {
    if (!parameter) return

    const { data, error } = await supabase
      .from('observation')
      .select(`
        units,
        parameter(name),
        measurement_agg(mean, sd, min, max, n)
      `)
      .ilike('parameter.name', parameter)

    if (error) {
      console.error(error)
      return
    }

    setResult(data)
  }


  // -----------------------------
  // UI RENDER
  // -----------------------------
  return (
    <main style={{ padding: '20px' }}>

      {/* -----------------------------
          HEADER / NAVIGATION
      ----------------------------- */}
      <h1>OcuBase</h1>

      <nav>
        <Link href="/submit">Submit</Link> |{" "}
        <Link href="/analytics">Analytics</Link>
      </nav>

      <hr />


      {/* -----------------------------
          QUICK QUERY TOOL
      ----------------------------- */}
      <h2>Quick Reference</h2>

      <input
        type="text"
        placeholder="Enter parameter (e.g. corneal thickness)"
        value={parameter}
        onChange={(e) => setParameter(e.target.value)}
      />

      <button onClick={handleQuery}>Get Baseline</button>


      {/* -----------------------------
          QUERY RESULTS DISPLAY
      ----------------------------- */}
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