"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { JobSite } from "@first2apply/core"

import { useError } from "./use-error"
import { useSdk } from "./use-sdk"

/**
 * Context that stores supported sites.
 */
export const SitesContext = createContext<{
  isLoading: boolean
  sites: JobSite[]
  siteLogos: Record<number, string>
  siteMap: Record<number, JobSite>
}>({ isLoading: true, sites: [], siteLogos: {}, siteMap: {} })

/**
 * Global hook used to access the supported sites.
 */
export const useSites = () => {
  const sites = useContext(SitesContext)
  if (sites === undefined) {
    throw new Error("useSites must be used within a SitesProvider")
  }
  return sites
}

// Create a provider for the sites
export const SitesProvider = ({ children }: React.PropsWithChildren) => {
  const { handleError } = useError()
  const sdk = useSdk()

  const [isLoading, setIsLoading] = useState(true)
  const [sites, setSites] = useState<JobSite[]>([])

  // Load the job sites list on mount
  useEffect(() => {
    const asyncLoad = async () => {
      try {
        setSites(await sdk.listSites())
        setIsLoading(false)
      } catch (error) {
        handleError({ error })
      }
    }

    asyncLoad()
  }, [])

  const siteLogos = Object.fromEntries(
    sites.map((site) => [site.id, site.logo_url])
  )
  const siteMap = Object.fromEntries(sites.map((site) => [site.id, site]))

  return (
    <SitesContext.Provider
      value={{
        isLoading,
        sites,
        siteLogos,
        siteMap,
      }}
    >
      {children}
    </SitesContext.Provider>
  )
}
