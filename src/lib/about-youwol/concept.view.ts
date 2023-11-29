import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { CardView } from './card.view'
import { SectionView, TextParagraphView } from './section.view'
import { basePathImages } from './common'

export class ConceptView extends SectionView {
    constructor() {
        super({
            title: 'The concept',
            subtitle: 'Abuse web-browsers',
            withClasses: 'border-left border-bottom',
            paragraphs: [
                new TextParagraphView({
                    innerHTML: `Positioned between your PC and the cloud is capable of merging the customizability of PC with the accessibility of cloud solutions.
                 Also, it inherently possesses the capability to execute a variety of computations.`,
                }),
                new GridView(),
                { tag: 'div', class: 'my-4' },
                new TextParagraphView({
                    innerHTML: `The concept? Extending local & cloud solutions by running and sharing code 
                 through web-browser. The only lacking component was a robust package manager able to install and link
                 runtimes dynamically directly into web-browsers. It is the essence of <a href="https://webpm.org" target="_blank">WebPM</a>:
                 promote an install-free, customizable & extendable runtime environment for browsers.`,
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
                imageUrl: `${basePathImages}/adaptor.png`,
                title: 'Standard',
                abstract: 'Standardized API & universal compilation target.',
                more: moreStandard,
            }),
            new CardView({
                imageUrl: `${basePathImages}/connected.png`,
                title: 'Connected',
                abstract: 'PC, servers & peripherals.',
                more: moreConnected,
            }),
            new CardView({
                imageUrl: `${basePathImages}/siwss-knife.png`,
                title: 'Flexible',
                abstract:
                    'Just-in-time compilation, various languages support.',
                more: moreFlexible,
            }),
            new CardView({
                imageUrl: `${basePathImages}/rocket.png`,
                title: 'Performant',
                abstract: 'Multi-threading, GPU, Web-Assembly ...',
                more: morePerformant,
            }),
        ]
    }
}

const moreStandard = `
Web browsers play a pivotal role in adhering to standardized practices, both in terms of APIs 
(Application Programming Interfaces) and as compilation targets. It provides multiple benefits.

#### **Cross-Browser Compatibility:**
   Standardized APIs ensure that web applications work consistently across different browsers, providing a seamless 
   user experience without compatibility issues.
#### **Language Diversity:**
   With Wasm as a compilation target, developers can choose from a variety of languages to write performance-critical code,
    promoting language diversity and flexibility in web development.
#### **Easier Maintenance:**
   Standardized APIs simplify the maintenance of web applications, as developers can rely on a set of well-defined interfaces. 
   This reduces the effort required for adapting code to different browser environments.
#### **Device Agnosticism:**
   The browser environment abstracts underlying hardware complexities, allowing applications to be device-agnostic. 
   Developers can create applications that seamlessly connect to various peripherals without the need for device-specific implementations.

`

const moreConnected = `
Web browsers serve as versatile platforms that facilitate seamless connections to PC, servers and peripherals.
#### **Remote Server Access:**
   Web browsers enable users to access and interact with PC servers remotely. This is particularly advantageous for scenarios where centralized server resources need to be leveraged for processing or data storage.
#### **Hardware Integration:**
   The availability of APIs for hardware access allows web applications to integrate seamlessly with peripherals. This includes capturing audio or video input, accessing device sensors, and interacting with external devices connected to the PC.
#### **Real-Time Interactivity:**
   Web browsers support real-time interactivity with PC servers and peripherals, facilitating dynamic and responsive user experiences. This is crucial for applications that require timely data updates or user interactions with connected devices.
`

const moreFlexible = `
Web browsers exhibit remarkable flexibility through features such as just-in-time (JIT) compilation and support for a diverse
 array of programming languages using WebAssembly (WASM).
#### **Just-in-time Compilation:**
   JIT compilation optimizes code execution at runtime, significantly improving the flexibility of web applications.
   It allows a dynamic translation of programs into machine code during runtime, providing the opportunity to dynamically install new runtimes during execution.
#### **Web Assembly:**
   Wasm as a compilation target further expands the language choices for developers (including languages like C, C++, 
   Rust, and others). 
   It empowers them to utilize languages traditionally associated with system-level programming, 
   unlocking new possibilities for high-performance computing directly within the browser.
   It also  allows developers to leverage the strengths of each language, contributing to a modular and extensible architecture.
   
`

const morePerformant = `
Web browsers leverage advanced technologies, including multi-threading, GPU support, and Web Assembly (Wasm), 
to deliver enhanced performance and capabilities. 

#### **Improved Responsiveness:**
   Web browsers implement multi-threading, allowing concurrent execution of tasks. This parallel processing enhances
    responsiveness and efficiency, especially for computationally intensive operations,
     by leveraging multiple threads to handle different aspects of a web application simultaneously.

#### **Graphics Performance:**
   Web browsers tap into the power of Graphics Processing Units (GPUs) to offload graphics-intensive tasks.
    GPU acceleration accelerates rendering and improves the performance of visually rich content, such as 3D graphics,
     animations, and complex visualizations.

#### **High-Performance Computing:**
  Web browsers support Web Assembly as a compilation target, enabling high-performance execution of code written in 
  languages like C, C++, and Rust. Wasm allows developers to harness the full potential of low-level optimizations, 
  delivering near-native speed for critical computations within the browser environment.

#### **Efficient Resource Utilization:**
   Multi-threading and GPU support enable browsers to utilize system resources more efficiently, distributing
    workloads across multiple cores and GPU units.
`
