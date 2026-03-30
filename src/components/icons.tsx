import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function IconBase(props: IconProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      {...props}
    />
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d='M12 5v14' />
      <path d='M5 12h14' />
    </IconBase>
  )
}

export function MenuIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d='M4 7h16' />
      <path d='M4 12h16' />
      <path d='M4 17h16' />
    </IconBase>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d='M4 7h16' />
      <path d='M10 11v6' />
      <path d='M14 11v6' />
      <path d='M6 7l1 11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-11' />
      <path d='M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2' />
    </IconBase>
  )
}

export function PaperclipIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d='M21.4 11.1 12 20.5a5 5 0 0 1-7.1-7.1l9.2-9.2a3.5 3.5 0 1 1 5 5L9.6 18.7a2 2 0 1 1-2.8-2.8l8.5-8.5' />
    </IconBase>
  )
}

export function SendIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d='m21 3-9.5 18-2.5-7.5L1 11z' />
      <path d='M21 3 9 13.5' />
    </IconBase>
  )
}

export function SparklesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d='m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z' />
      <path d='m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z' />
      <path d='m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8z' />
    </IconBase>
  )
}

export function ImageIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x='3' y='5' width='18' height='14' rx='2' />
      <circle cx='9' cy='10' r='1.4' />
      <path d='m21 15-4.5-4.5L8 19' />
    </IconBase>
  )
}

export function FileIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d='M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z' />
      <path d='M14 3v5h5' />
      <path d='M9 13h6' />
      <path d='M9 17h4' />
    </IconBase>
  )
}

export function BotIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x='5' y='7' width='14' height='11' rx='3' />
      <path d='M12 3v4' />
      <path d='M8.5 18 7 21' />
      <path d='M15.5 18 17 21' />
      <circle cx='10' cy='12' r='1' fill='currentColor' stroke='none' />
      <circle cx='14' cy='12' r='1' fill='currentColor' stroke='none' />
    </IconBase>
  )
}
