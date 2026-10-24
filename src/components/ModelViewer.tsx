import { Component, Suspense, useRef, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { Center, Environment, OrbitControls, useGLTF } from '@react-three/drei'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { AlertTriangle, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'

function Model({ src }: { src: string }) {
  const { scene } = useGLTF(src)
  return <Center><primitive object={scene.clone()} /></Center>
}

function Fallback({ image, message }: { image: string | null; message?: string }) {
  return <div className="viewer-fallback">{image ? <img src={image} alt="Рендер модели" /> : <div className="fallback-mark">X</div>}{message && <span><AlertTriangle size={15} /> {message}</span>}</div>
}

class ModelErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export function ModelViewer({ src, fallback }: { src: string; fallback: string | null }) {
  const controls = useRef<OrbitControlsImpl | null>(null)
  const zoom = (factor: number) => {
    const control = controls.current
    if (!control) return
    control.object.position.sub(control.target).multiplyScalar(factor).add(control.target)
    control.update()
  }
  return <div className="model-viewer"><ModelErrorBoundary key={src} fallback={<Fallback image={fallback} message="Не удалось загрузить модель" />}><Canvas camera={{ position: [3, 2.4, 4], fov: 38 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: false }}><color attach="background" args={['#181818']} /><ambientLight intensity={1.1} /><directionalLight position={[3, 4, 4]} intensity={2} /><Suspense fallback={<div className="viewer-loading">Загрузка модели…</div>}><Model src={src} /><Environment preset="studio" /></Suspense><OrbitControls ref={controls} enableDamping minDistance={1.4} maxDistance={8} /></Canvas></ModelErrorBoundary><div className="viewer-controls"><button aria-label="Сбросить камеру" onClick={() => controls.current?.reset()}><RotateCcw /></button><button aria-label="Приблизить" onClick={() => zoom(0.82)}><ZoomIn /></button><button aria-label="Отдалить" onClick={() => zoom(1.22)}><ZoomOut /></button></div><div className="viewer-caption">ПЕРЕТАЩИТЕ ДЛЯ ВРАЩЕНИЯ / КОЛЁСИКО ДЛЯ МАСШТАБА</div></div>
}

export default ModelViewer

export function preloadModel(src: string) { useGLTF.preload(src) }
