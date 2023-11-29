import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { CardView } from './card.view'
import { SectionView, TextParagraphView } from './section.view'
import { basePathImages } from './common'
export class NeedSectionView extends SectionView {
    constructor() {
        super({
            title: 'The need',
            subtitle: 'Customization, accessibility',
            withClasses: 'border-right border-bottom',
            paragraphs: [
                {
                    tag: 'div',
                    class: 'w-100',
                    children: [new GridView()],
                },
                { tag: 'div', class: 'my-2' },
                new TextParagraphView({
                    innerHTML: `The need YouWol aims fulfill is to provide a computing solution that sits between traditional 
                PCs and cloud platforms. 
                It shall make runtime widely accessible while also ensuring that users, regardless of their expertise,
                 can easily customize and extend it to meet their specific needs.`,
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
                imageUrl: `${basePathImages}/laptop.png`,
                title: 'PC',
                abstract: new PropertiesView({
                    accessible: 0,
                    customizable: 1,
                }),
                more: morePC,
            }),
            new CardView({
                imageUrl: `${basePathImages}/servers.png`,
                title: 'Servers',
                abstract: new PropertiesView({
                    accessible: 1,
                    customizable: 0,
                }),
                more: moreServers,
            }),
        ]
    }
}

class PropertiesView implements VirtualDOM<'div'> {
    public readonly tag = 'div'
    public readonly class = 'd-flex flex-column'
    public readonly children: ChildrenLike
    constructor({
        accessible,
        customizable,
    }: {
        accessible: 0 | 1
        customizable: 0 | 1
    }) {
        const classes = {
            1: 'fa-check fv-text-success',
            0: 'fa-times fv-text-error',
        }
        const separator = { tag: 'div' as const, class: 'mx-2' }
        const child = (innerText: string, mode: 0 | 1): VirtualDOM<'div'> => ({
            tag: 'div' as const,
            class: 'd-flex align-items-center',
            children: [
                {
                    tag: 'i',
                    class: `fas ${classes[mode]} align-items-center`,
                },
                separator,
                {
                    tag: 'div',
                    innerText,
                },
            ],
        })

        this.children = [
            child('Customizable', customizable),
            child('Accessible', accessible),
        ]
    }
}

const morePC = `
Personal Computers (PCs) are renowned for their customizable nature, allowing users to tailor hardware and software
 configurations to their specific needs. However, this customization, while empowering for the individual user,
  presents challenges in terms of accessibility for others.

#### **Dependency Management:**
   Customized environments often involve a myriad of dependencies. Sharing a project or software developed in such an
    environment can become challenging, as others may need to invest time in replicating the exact dependencies to 
    ensure the application runs as intended.

#### **Installation Complexity:**
   The process of installing and configuring a customized environment can be complex, especially for individuals who
    are not familiar with the specific tools and settings used by the developer.
     This complexity poses a barrier to accessibility for those who wish to collaborate or use the software.

#### **Versioning and Compatibility:**
   Customized environments may rely on specific versions of libraries or tools. Ensuring version compatibility across
    different machines becomes crucial, and the absence of standardized configurations can lead to versioning 
    conflicts and difficulties in maintaining consistency.

#### **Time and Learning Curve:**
   Replicating a customized environment often requires a significant time investment and may involve a steep learning 
   curve for those unfamiliar with the specific tools or development stacks used.
    This can discourage collaboration and hinder the sharing of knowledge.
`

const moreServers = `
Servers are designed to be accessible, allowing users to access and benefit from hosted services without the
need for intricate installation processes. 
 However, this accessibility comes at the price of challenges in terms of customization.

#### **Limited User Control:**
   While servers prioritize accessibility, the level of control granted to individual users is often limited. 
   Backend services are typically managed by system administrators or hosting providers, restricting users' ability to 
   customize underlying configurations or add new services.

#### **Technical Expertise Requirements:**
   Customizing or deploying backend services often demands a certain level of technical expertise.
    Users without a background in server administration may find it challenging to implement specialized configurations 
    or integrate custom functionalities.

#### **Dependency on Service Providers:**
   Users relying on servers are dependent on service providers for the customization and configuration of backend services. 
   This dependency can be limiting for users who have specific requirements that fall outside the predefined offerings 
   of the service provider.
`
