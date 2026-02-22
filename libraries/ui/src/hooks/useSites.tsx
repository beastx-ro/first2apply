"use client"

import { createContext, useContext, useState } from "react"
import type { JobSite } from "@first2apply/core"

import { useError } from "./useError"
import { useSdk } from "./useSdk"

/**
 * Context that stores supported sites.
 */
export const SitesContext = createContext<{
  isLoading: boolean
  sites: JobSite[]
  siteLogos: Record<number, string>
  siteMap: Record<number, JobSite>
  reloadSites: () => Promise<void>
}>({
  isLoading: true,
  sites: [],
  siteLogos: {},
  siteMap: {},
  reloadSites: async () => {},
})

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
export const SitesProvider = ({
  sites: initialSites,
  children,
}: React.PropsWithChildren<{
  sites: JobSite[]
}>) => {
  const { handleError } = useError()
  const sdk = useSdk()

  const [isLoading, setIsLoading] = useState(initialSites.length === 0)
  const [sites, setSites] = useState<JobSite[]>(initialSites)

  const fetchSites = async () => {
    try {
      setSites(await sdk.listSites())
      setIsLoading(false)
    } catch (error) {
      handleError({ error })
    }
  }

  const siteLogos = Object.fromEntries(
    sites.map((site) => [site.id, site.logo_url])
  )
  const siteMap = Object.fromEntries(sites.map((site) => [site.id, site]))

  const onReloadSites = async () => {
    await fetchSites()
  }

  return (
    <SitesContext.Provider
      value={{
        isLoading,
        sites,
        siteLogos,
        siteMap,
        reloadSites: onReloadSites,
      }}
    >
      {children}
    </SitesContext.Provider>
  )
}
