import { BUILD_MANIFEST, REACT_LOADABLE_MANIFEST } from '../lib/constants'
import { join } from 'path'
import { requirePage } from './require'
import { BuildManifest } from './get-page-files'
import { AppType, DocumentType } from '../lib/utils'
import {
  PageConfig,
  GetStaticPaths,
  GetServerSideProps,
  GetStaticProps,
} from 'next/types'

export function interopDefault(mod: any) {
  return mod.default || mod
}

export type ManifestItem = {
  id: number | string
  name: string
  file: string
}

type ReactLoadableManifest = { [moduleId: string]: ManifestItem[] }

export type LoadComponentsReturnType = {
  Component: React.ComponentType
  pageConfig?: PageConfig
  buildManifest: BuildManifest
  reactLoadableManifest: ReactLoadableManifest
  Document: DocumentType
  App: AppType
  appGetStaticProps?: GetStaticProps
  getStaticProps?: GetStaticProps
  getStaticPaths?: GetStaticPaths
  getServerSideProps?: GetServerSideProps
}

export async function loadComponents(
  distDir: string,
  pathname: string,
  serverless: boolean
): Promise<LoadComponentsReturnType> {
  if (serverless) {
    const Component = await requirePage(pathname, distDir, serverless)
    const { getStaticProps, getStaticPaths, getServerSideProps } = Component

    return {
      Component,
      pageConfig: Component.config || {},
      getStaticProps,
      getStaticPaths,
      getServerSideProps,
    } as LoadComponentsReturnType
  }

  const DocumentMod = requirePage('/_document', distDir, serverless)
  const AppMod = requirePage('/_app', distDir, serverless)
  const ComponentMod = requirePage(pathname, distDir, serverless)

  const [
    buildManifest,
    reactLoadableManifest,
    Component,
    Document,
    App,
  ] = await Promise.all([
    require(join(distDir, BUILD_MANIFEST)),
    require(join(distDir, REACT_LOADABLE_MANIFEST)),
    interopDefault(ComponentMod),
    interopDefault(DocumentMod),
    interopDefault(AppMod),
  ])

  const { getServerSideProps, getStaticProps, getStaticPaths } = ComponentMod
  const { getStaticProps: appGetStaticProps } = AppMod

  return {
    App,
    Document,
    Component,
    buildManifest,
    reactLoadableManifest,
    pageConfig: ComponentMod.config || {},
    appGetStaticProps,
    getServerSideProps,
    getStaticProps,
    getStaticPaths,
  }
}
