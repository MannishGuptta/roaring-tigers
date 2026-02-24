export const supabase = {
  from: (table) => ({
    select: () => ({
      eq: (column, value) => ({
        eq: (column2, value2) => ({
          then: async (resolve) => {
            try {
              const response = await fetch(`https://roaring-tigers-backend.onrender.com/${table}?${column}=${value}&${column2}=${value2}`)
              const data = await response.json()
              resolve({ data, error: null })
            } catch (err) {
              resolve({ data: null, error: { message: err.message } })
            }
          }
        }),
        then: async (resolve) => {
          try {
            const response = await fetch(`https://roaring-tigers-backend.onrender.com/${table}?${column}=${value}`)
            const data = await response.json()
            resolve({ data, error: null })
          } catch (err) {
            resolve({ data: null, error: { message: err.message } })
          }
        }
      })
    }),
    insert: (records) => ({
      then: async (resolve) => {
        try {
          const response = await fetch(`https://roaring-tigers-backend.onrender.com/${table}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(records)
          })
          const data = await response.json()
          resolve({ data, error: null })
        } catch (err) {
          resolve({ data: null, error: { message: err.message } })
        }
      }
    })
  })
}
