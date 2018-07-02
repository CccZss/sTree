(function(window){
    function extend(subClass, superClass) {
        var F = function() {}
        F.prototype = superClass.prototype;
        subClass.prototype = new F();
        subClass.prototype.constructor = subClass;
        subClass.superclass = superClass.prototype
        if(superClass.prototype.contructor == Object.prototype.constructor) {
            superClass.prototype.constructor = superClass;
        }
    }
    /* 树类 */
    function STree(wrapElm, data, option) {
        var obj = Object.assign({}, STree.defaultOption)
        option = Object.assign(obj, option)
        this.option = option;
        this.element = wrapElm;
        this.element.className += " tree-wrap"
        this.rootNode = new STreeRoorNode("选择全部", null, option)
        this.data = data;
        this.element.appendChild(this.rootNode.element);
        this._setData(data, this.option);
    }
    STree.defaultOption = {
        defaultSelects: [],   // 通过id数组初始化选择的项
        name: 'name',         // 传入的 data 中，作为显示的文字的字段
        id: 'id',             // 传入的字段中，作为标识一个项的字段
        hasRootElement: true,  // 是否有全选的根字段
        onSelectChange: function(item){},   // 有某一项的选择状态改变时触发，item 为触发项对象
        onShowChange: function(item){}     // 有某一项的显示状态改变时触发，item 为触发项对象
    }
    STree.prototype._addNode =  function(child){
        if(!this.rootNode) {
            return
        }
        child.parendNode = this.rootNode;
        this.rootNode.childrenList.push(child)
        this.rootNode.childElement.appendChild(child.element);
        if(!child.isSelect && child.parendNode.isSelect) {
            child.parendNode.unSelectSelf()
        }
    };
    STree.prototype._setData = function(data, option) {
        if(!data) {
            return;
        }
        var that = this
        data.forEach(function(data) {
            if(data.childrens) {
                var node = new STreeGroupNode(data[option.name], data[option.id], option);
                that._addNode(node);
                data.childrens.forEach(function(data) {
                    node._setData(data, option);
                })
            }else {
                var node = new STreeItemNode(data[option.name], data[option.id], option);
                that._addNode(node);
                if(option.defaultSelects.indexOf(node.id)!==-1) {
                    node.select()
                }
            }
        })
    }
    STree.prototype.resetData = function(data, option) {
        if(option) {
            var obj = Object.assign({}, this.option)
            this.option = Object.assign(obj, option)
        }
        if(data) {
            this.data = data;
        }
        this.clearData();
        this._setData(this.data, this.option);
    }
    STree.prototype.clearData = function() {
        if(!this.rootNode) {
            return
        }
        this.rootNode.childrenList = [];
        this.rootNode.childElement.innerHTML = "";
    }
    STree.prototype.changeNodeSelect = function(id, status) {
        if(!this.rootNode) {
            return
        }
        var item = this.rootNode.getChildNodeById(id)[0];
        if(item) {
            if(status) {
                item.select()
            }else {
                item.unSelect()
            }
        }
    }
    STree.prototype.getChildNodeById = function(id) {
        if(!this.rootNode) {
            return null
        }
        return this.rootNode.getChildNodeById(id)[0]
    }
    STree.prototype.setNodeItem = function(item) {
        if(!this.rootNode) {
            return
        }
        this.rootNode._addNode(item)
    }
    STree.prototype.getAllSelectItemInfo = function() {
        if(!this.rootNode) {
            return []
        }
        var selectNodes = this.rootNode.getSelectChild();
        var infos = [];
        selectNodes.forEach(function(node){
            infos.push(node.getNodeInfo());
        })
        return infos;
    }
    STree.prototype.getAllItemNodeInfo = function() {
        if(!this.rootNode) {
            return []
        }
        var nodes = this.rootNode.getAllItemNode();
        var infos = [];
        nodes.forEach(function(node){
            infos.push(node.getNodeInfo());
        })
        return infos;
    }
    STree.prototype.isSelectAll = function() {
        return this.getAllItemNodeInfo().length === this.getAllSelectItemInfo().length
    }
    STree.prototype.unSelectAll = function() {
        if(!this.rootNode) {
            return null
        }
        this.rootNode.unSelect()
    }
    STree.prototype.selectAll = function() {
        if(!this.rootNode) {
            return null
        }
        this.rootNode.select();
    }
    STree.prototype.destroy = function() {
        if(!this.rootNode) {
            return null
        }
        this.rootNode.childrenList.forEach(function(item) {
            item.destroy();
        })
        this.rootNode.element.parentElement.removeChild(this.rootNode.element)
        this.rootNode.childrenList = null;
        this.data = null;
        this.option = null;
        this.element = null;
        this.rootNode = null;
    }

    /* 树的 node 接口类 */
    var STreeNode = function (name, id, type, option) {
        this.name = name;
        this.id = id;
        this.type = type;  // 'group | item'
        this.element = null;
        this.checkBoxEle = null;
        this.isSelect = false;
        this.childrenList = [];
        this.parendNode = null;

        this.onSelectChange =  option.onSelectChange
        this.onShowChange =  option.onShowChange
    }
    STreeNode.prototype._addNode = function(child){
        child.parendNode = this;
        this.childrenList.push(child);
        this.childElement.appendChild(child.element);
        if(!child.isSelect && child.parendNode.isSelect) {
            child.parendNode.unSelectSelf()
        }
    };
    STreeNode.prototype._removeNode = function(child){
        for(var i=0; i<this.childrenList.length ;i++) {
            if(this.childrenList(i) == child) {
                this.childrenList.splice(i, 1);
                child._removeNode()
                break;
            }
        }
    };
    STreeNode.prototype.select = function(){
        this.isSelect = true;
        if(this.type === 'item') {
            this.checkBoxEle.setAttribute("checked", "checked");
            this.onSelectChange(this)
        }
        this.childrenList.forEach(function(item){
            item.select();
        })
        if(this.parendNode) {
            this.parendNode._childSelectChange(this.id, this.isSelect)
        }
    };
    STreeNode.prototype.unSelect = function(){
        this.checkBoxEle.removeAttribute("checked")
        this.isSelect = false;
        if(this.type === 'item') {
            this.onSelectChange(this)
        }
        this.childrenList.forEach(function(item){
            item.unSelect();
        })
        if(this.parendNode) {
            this.parendNode._childSelectChange(this.id, this.isSelect)
        }
    };
    STreeNode.prototype.getNodeInfo = function() {
        return {
            name: this.name,
            id: this.id
        }
    }
    STreeNode.prototype.destroy = function() {
        if(this.childrenList.length > 0) {
            this.childrenList.forEach(function(item) {
                item.destroy();
            })
            this.element.parentElement.removeChild(this.element)
            this.childrenList = null;
        }else {
            this.element.parentElement.removeChild(this.element)
        }
    }


    /* 树的 group node 类 */
    var STreeGroupNode = function(name, id, option) {
        STreeNode.call(this, name, id, 'group', option);
        this.isShow = false;

        this.element = document.createElement('li');
        this.element.className = "list-item-wrap group-item";

        this.childElement = document.createElement('ul');
        this.childElement.className = "group-item-wrap";

        var itemEle = document.createElement('span');
        itemEle.className = "item";
        var iconEle = document.createElement('span');
        iconEle.className = "icon icon-group";
        var nameEle = document.createElement('span');
        nameEle.innerHTML = this.name;
        nameEle.className = "name"
        var labelEle = document.createElement('span');
        labelEle.className = "checkbox"
        this.checkBoxEle = document.createElement('input');
        this.checkBoxEle.setAttribute("type", "checkbox");
        labelEle.appendChild(this.checkBoxEle);
        labelEle.appendChild(document.createElement('i'))
        itemEle.appendChild(iconEle);
        itemEle.appendChild(nameEle);
        itemEle.appendChild(labelEle);
        this.element.appendChild(itemEle);
        this.element.appendChild(this.childElement);

        itemEle.onclick = function(event) {
            if(event.target.nodeName.toUpperCase() !== "I"){
                if(this.element.className.indexOf('open') === -1) {
                    this.show();
                }else {
                    this.hide();
                }
            }
        }.bind(this)

        labelEle.onclick = function(even) {
            if(event.target.nodeName.toUpperCase() === "I"){
                if(this.isSelect) {
                    this.unSelect();
                }else {
                    this.select();
                }
            }
        }.bind(this)
    }
    extend(STreeGroupNode, STreeNode);
    STreeGroupNode.prototype.show = function(){
        this.isShow = true;
        if(this.element.className.indexOf('open') == -1) {
            this.element.className = this.element.className.trim() + " open";
        }
        if(this.parendNode) {
            this.parendNode.show()
        }
        this.onShowChange(this)
    };
    STreeGroupNode.prototype.hide = function(){
        this.isShow = false
        if(this.element.className.indexOf('open') !== -1) {
            this.element.className = this.element.className.split("open").join(" ").trim()
        }
        this.onShowChange(this)
    };
    STreeGroupNode.prototype.selectSelf = function(){   //group
        this.checkBoxEle.setAttribute("checked", "checked");
        this.isSelect = true;
        if(this.type === 'item') {
            this.onSelectChange(this)
        }
        if(this.parendNode) {
            this.parendNode._childSelectChange(this.id, this.isSelect)
        }
    };
    STreeGroupNode.prototype.unSelectSelf = function(){  //group
        this.checkBoxEle.removeAttribute("checked")
        this.isSelect = false;
        if(this.type === 'item') {
            this.onSelectChange(this)
        }
        if(this.parendNode) {
            this.parendNode._childSelectChange(this.id, this.isSelect)
        }
    };
    STreeGroupNode.prototype._setData = function(data, option) {  //group
        if(data.childrens) {
            var node = new STreeGroupNode(data[option.name], data[option.id], option);
            this._addNode(node);
            data.childrens.forEach(function(data) {
                node._setData(data, option);
            })
        }else {
            var node = new STreeItemNode(data[option.name], data[option.id], option);
            this._addNode(node);
            if(option.defaultSelects.indexOf(node.id)!==-1) {
                node.select()
            }
        }
    }
    STreeGroupNode.prototype.getChildNodeById = function(id) {  //group
        var data = [];
        this.childrenList.forEach(function(item) {
            if(item.childrenList && item.childrenList.length > 0) {
                data = data.concat(item.getChildNodeById(id));
            }
            if(item.id == id) {
                data.push(item);
            }
        }) 
        return data;
    }
    STreeGroupNode.prototype.getSelectChild = function() {
        var data = [];
        this.childrenList.forEach(function(node){
            if(node.type !== 'item') {
                data = data.concat(node.getSelectChild())
            }else {
                if(node.isSelect){
                    data.push(node);
                }
            }
        })
        return data;
    }
    STreeGroupNode.prototype.getAllItemNode = function() {
        var data = [];
        this.childrenList.forEach(function(node){
            if(node.type !== 'item') {
                data = data.concat(node.getAllItemNode())
            }else {
                data.push(node);
            }
        })
        return data;
    }
    STreeGroupNode.prototype._childSelectChange = function(id, status) {
        if(status) {
            this.show()
        }
        var selectItems = [];
        this.childrenList.forEach(function(item) {
            if(item.isSelect) {
                selectItems.push(item);
            }
        })
        if(selectItems.length < this.childrenList.length && this.isSelect === true) {
            this.unSelectSelf()
        }else if(selectItems.length === this.childrenList.length) {
            this.selectSelf()
        }
    }

    /* 树的 item node 类 */
    var STreeItemNode = function(name, id, option) {
        STreeNode.call(this, name, id, 'item', option);

        this.element = document.createElement('li');
        this.element.className = "list-item-wrap";

        var itemEle = document.createElement('span');
        itemEle.className = "item";
        var iconEle = document.createElement('span');
        iconEle.className = "icon";
        var nameEle = document.createElement('span');
        nameEle.innerHTML = this.name;
        nameEle.className = "name"
        var labelEle = document.createElement('span');
        labelEle.className = "checkbox"
        this.checkBoxEle = document.createElement('input');
        this.checkBoxEle.setAttribute("type", "checkbox");
        labelEle.appendChild(this.checkBoxEle);
        labelEle.appendChild(document.createElement('i'))
        // itemEle.appendChild(iconEle);
        itemEle.appendChild(nameEle);
        itemEle.appendChild(labelEle);
        this.element.appendChild(itemEle);

        itemEle.onclick = function(event) {
            if(this.isSelect) {
                this.unSelect();
            }else {
                this.select();
            }
        }.bind(this)
    }
    extend(STreeItemNode, STreeNode);

    var STreeRoorNode = function(name, id, option) {
        STreeNode.call(this, name, id, 'root', option);

        this.element = document.createElement('div');
        this.element.className = "list-item-wrap root-item open";

        this.childElement = document.createElement('ul');
        this.childElement.className = "group-item-wrap";

        var itemEle = document.createElement('span');
        itemEle.className = "item";
        var iconEle = document.createElement('span');
        iconEle.className = "icon icon-all";
        var nameEle = document.createElement('span');
        nameEle.innerHTML = this.name;
        nameEle.className = "name"
        var labelEle = document.createElement('span');
        labelEle.className = "checkbox"
        this.checkBoxEle = document.createElement('input');
        this.checkBoxEle.setAttribute("type", "checkbox");
        labelEle.appendChild(this.checkBoxEle);
        labelEle.appendChild(document.createElement('i'))
        itemEle.appendChild(iconEle);
        itemEle.appendChild(nameEle);
        itemEle.appendChild(labelEle);
        if(option.hasRootElement) {
            this.element.appendChild(itemEle);
        }
        this.element.appendChild(this.childElement);

        itemEle.onclick = function(event) {
            if(event.target.nodeName.toUpperCase() !== "I"){
                if(this.element.className.indexOf('open') === -1) {
                    this.show();
                }else {
                    this.hide();
                }
            }
        }.bind(this)

        labelEle.onclick = function(even) {
            if(event.target.nodeName.toUpperCase() === "I"){
                if(this.isSelect) {
                    this.unSelect();
                }else {
                    this.select();
                }
            }
        }.bind(this)
    }
    extend(STreeRoorNode, STreeGroupNode);

    window.STree = STree
})(window)