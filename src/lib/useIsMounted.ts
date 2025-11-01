// File: src/lib/useIsMounted.ts
import { useEffect, useState } from 'react'

export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return isMounted
}