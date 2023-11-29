import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { CardView } from './card.view'
import { SectionView, TextParagraphView } from './section.view'
import { basePathImages } from './common'

export class GettingWildView extends SectionView {
    constructor() {
        super({
            title: 'Getting wild',
            subtitle: 'Local resources, custom backends, SDK',
            withClasses: 'border-left',
            paragraphs: [
                new TextParagraphView({
                    innerHTML: `Because everything can not run in a browser, be it for technical or security reasons,
                        the all youwol environment can run in a personal computer. 
                        You get the best of what a hybrid local/cloud environment can provide.`,
                }),
                new GridView(),
                { tag: 'div', class: 'my-4' },
                new TextParagraphView({
                    innerHTML: `Want to get started? Execute the command: <pre><b><i>pipx run youwol</i></b></pre>
 and visit our interactive tours presented <a href="">here</a>`,
                }),
            ],
        })
    }
}

class GridView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'd-flex flex-wrap justify-content-around '
    public readonly children: ChildrenLike
    constructor() {
        this.children = [
            new CardView({
                imageUrl: `${basePathImages}/youwol-in-pc.png`,
                title: 'YouWol in PC',
                abstract: 'Running the entire infrastructure locally',
                more: moreYwInPC,
            }),
            new CardView({
                imageUrl: `${basePathImages}/bring-pc-pieces.png`,
                title: 'Local resources',
                abstract:
                    'Open the opportunity to consume whatever is available in your PC',
                more: moreLocalResources,
            }),
            new CardView({
                imageUrl: `${basePathImages}//os-tools.png`,
                title: 'SDK',
                abstract: 'Code as you like, deploy when you want',
                more: moreSDK,
            }),
        ]
    }
}

const moreYwInPC = `
Running the entire infrastructure locally offers several practical benefits:

#### **Local Development Empowerment:**
Running YouWol services on a personal computer facilitates local development and testing.

#### **Efficient Resources Handling:**
All resources are lazily fetched and installed from the cloud. 
   They are only brought down on-demand, optimizing resource usage. They are also persisted locally for a consistent & optimized experience.

#### **Transparent Use of Custom Backends:**
Unlike the online version, the local setup enables the transparent use of custom backends. 
   Just like other resources, if a particular backend gets required in a workflow, it will be installed at a compatible version
   and persisted in your computer (along with the particular environment it requires).

#### **Configurability of Local Servers:**
Local servers are highly configurable, allowing users to adapt them to specific needs through middleware options, 
   custom commands, and flexible configuration adjustments.
`

const moreLocalResources = `
Because the local server run in your own PC, it opens up the ability to use in your workflow 
data, softwares or environments that are only available in your computer (or that can not be shared).
It is particularly relevant for instance to use data that can not be published online for security reasons,
use programs that can not be shared with others through webpm or a custom backends, or interacting with
your OS to provide access to development tools. 
`

const moreSDK = `In addition to the online services, the local iteration of YouWol introduces the concept of 
projects, representing a versatile formalization of an executable designed to run within the YouWol 
environment. These projects are backed by pipelines, which explicitly outline the procedures for
building, testing, publishing, and more. This framework offers a flexible and collaborative approach, 
simplifying the definition of development configurations.

Executables within projects fall into two categories: 
*  **browser-compatible**: derived from languages
                   like JavaScript or TypeScript that transpile to JavaScript or WebAssembly and can be executed in a browser, 
*  **browser-incompatible**: formalized as backend services but currently unavailable online (yet installed transparently in the local version of youwol).
`
