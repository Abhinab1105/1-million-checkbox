export function createElement(type,props={},...children){
    return {
        type,
        props,
        children
    }
}

function setProp(element,key,value){
    if(key === 'checked'){
        element.checked = value
    }else if(key === 'className'){
        element.className = value
    }else{
        element.setAttribute(key,value)
    }
}

export function render(vnode){
    const element = document.createElement(vnode.type)

    for(const [key,value] of Object.entries(vnode.props)){
        setProp(element,key,value)
    }

    for(const child of vnode.children){
        element.appendChild(render(child))
    }

    return element
}

export function diff(oldTree,newTree){
    const changes = []

    for(let i=0;i<newTree.length;i++){
        let propsChanged = {}
        const oldNode = oldTree[i]
        const newNode = newTree[i]

        for(const key of Object.keys(newNode.props)){
            if(oldNode.props[key] !== newNode.props[key]){
                propsChanged[key] = newNode.props[key]
            }
        }

        if(Object.keys(propsChanged).length > 0){
            changes.push({
                index : i,
                propsChanged
            })
        }

    }

    return changes

}

export function patch(parent,changes){
    for(const change of changes){
        
        const element = parent.children[changes.index]

        for([key,value] of changes.props){
            setProp(element,key,value)
        }
    }
}