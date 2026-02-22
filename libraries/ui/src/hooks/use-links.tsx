"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { Link } from "@first2apply/core"

import { useError } from "./use-error"
import { useSdk } from "./use-sdk"

// Define the shape of the context data
type LinksContextType = {
  isLoading: boolean
  links: Link[]
  linkMap: Record<number, Link>
  createLink: (
    newLink: Pick<Link, "title" | "url"> & {
      html: string
    }
  ) => Promise<Link>
  updateLink: (
    linkId: number,
    data: { title: string; url: string }
  ) => Promise<void>
  removeLink: (linkId: number) => Promise<void>
  reloadLinks: () => Promise<void>
}

// Create the context with an initial default value
export const LinksContext = createContext<LinksContextType>({
  isLoading: true,
  links: [],
  linkMap: {},
  createLink: async () => {
    throw new Error("createLink not implemented")
  },
  updateLink: async () => {
    throw new Error("updateLink not implemented")
  },
  removeLink: async () => {
    throw new Error("removeLink not implemented")
  },
  reloadLinks: async () => {
    throw new Error("reloadLinks not implemented")
  },
})

// Hook for consuming context
export const useLinks = () => {
  const context = useContext(LinksContext)
  if (context === undefined) {
    throw new Error("useLinks must be used within a LinksProvider")
  }
  return context
}

// Provider component
export const LinksProvider = ({ children }: React.PropsWithChildren) => {
  const { handleError } = useError()
  const sdk = useSdk()

  const [isLoading, setIsLoading] = useState(true)
  const [links, setLinks] = useState<Link[]>([])

  const fetchLinks = async () => {
    try {
      const fetchedLinks = await sdk.listLinks()
      setLinks(fetchedLinks)
      setIsLoading(false)
    } catch (error) {
      handleError({ error })
    }
  }

  const linkMap = useMemo(
    () => Object.fromEntries(links.map((link) => [link.id, link])),
    [links]
  )

  // Create a new link
  const onCreateLink = async (
    newLink: Pick<Link, "title" | "url"> & {
      html: string
    }
  ) => {
    const createdLink = await sdk.createLink(newLink)
    setLinks((currentLinks) => [createdLink, ...currentLinks])
    return createdLink
  }

  // Update an existing link
  const onUpdateLink = async (
    linkId: number,
    data: { title: string; url: string }
  ) => {
    const updatedLink = await sdk.updateLink({
      linkId,
      title: data.title,
      url: data.url,
    })
    setLinks((currentLinks) =>
      currentLinks.map((link) =>
        link.id === linkId ? { ...link, ...updatedLink } : link
      )
    )
  }

  // Remove an existing link
  const onRemoveLink = async (linkId: number) => {
    await sdk.deleteLink(linkId)
    setLinks((currentLinks) =>
      currentLinks.filter((link) => link.id !== linkId)
    )
  }

  // Reload links
  const onReloadLinks = async () => {
    await fetchLinks()
  }

  // Fetch links on component mount
  useEffect(() => {
    fetchLinks()
  }, [])

  return (
    <LinksContext.Provider
      value={{
        isLoading,
        links,
        linkMap,
        createLink: onCreateLink,
        updateLink: onUpdateLink,
        removeLink: onRemoveLink,
        reloadLinks: onReloadLinks,
      }}
    >
      {children}
    </LinksContext.Provider>
  )
}
