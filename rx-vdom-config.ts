type AllTags = keyof HTMLElementTagNameMap
export type Configuration = {
    TypeCheck: 'strict'
    SupportedHTMLTags: 'Dev' extends 'Prod' ? AllTags : DevTags
    WithFluxView: false
}

type DevTags =
    | 'div'
    | 'span'
    | 'i'
    | 'option'
    | 'select'
    | 'iframe'
    | 'input'
    | 'h3'
    | 'h5'
    | 'h6'
    | 'img'
    | 'p'
