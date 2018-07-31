// 全局暴露构造函数变量：STree，不依赖外部库

/* 具有以下方法，具体说明请看下面源码注释：
 * 1. resetData
 * 2. clearData
 * 3. changeNodeSelect
 * 4. setNodeItem
 * 5. getAllSelectItemInfo
 * 6. getAllItemNodeInfo
 * 7. isSelectAll
 * 8. selectAll
 * 9. unSelectAll
 * 10. selectItems
 * 11. destroy
*/ 

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
        name: 'name',         // 传入的 data 中，作为显示的文字的属性
        id: 'id',             // 传入的 data 中，作为标识一个项的属性
        singleSelect: false,
        hasRootElement: true,  // 是否创建一个包含所有节点的根节点
        onSelectChange: function(item){},   // 钩子函数，当有某一项的选择状态改变时触发，回调函数的参数 item 为触发项对象
        onShowChange: function(item){}     // 钩子函数，有某一项的显示状态改变时触发，回调函数的参数 item 为触发项对象
    }
    STree.prototype._addNode =  function(child){
        if(!this.rootNode) {
            return
        }
        child.parentNode = this.rootNode;
        this.rootNode.childrenList.push(child)
        this.rootNode.childElement.appendChild(child.element);
        if(!child.isSelect && child.parentNode.isSelect) {
            child.parentNode.unSelectSelf()
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

    /* 重置树的信息
     * data: 初始数据, 没个节点有三个属性 [name, id, childrens(可选)] ，支持多重 childrens 嵌套
       例如: [{ 
        name: "部门一", 
        id: 1, 
        childrens:[{
            name1: "小组1-1",
                id1: 2,
            },{
                name1: "小组1-2",
                id1: 3
            }]
        },...]
     * option: 配置信息，具体参考 STree.defaultOption对象
     */
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

    // 清空数据，保留配置
    STree.prototype.clearData = function() {
        if(!this.rootNode) {
            return
        }
        this.rootNode.childrenList = [];
        this.rootNode.childElement.innerHTML = "";
    }

    /* 根据节点 Id 修改节点选择状态
     * id: 节点 Id
     * status: true(选中)， false(取消选中)
     */
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

    // 根据节点 Id 获取某个节点实例
    STree.prototype.getChildNodeById = function(id) {
        if(!this.rootNode) {
            return null
        }
        return this.rootNode.getChildNodeById(id)[0]
    }

    // 在跟节点下添加新节点，item 参考 resetData 的 data 参数
    STree.prototype.setNodeItem = function(item) {
        if(!this.rootNode) {
            return
        }
        this.rootNode._addNode(item)
    }

    // 获取当前树实例选中的项
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

    // 获取当前树实例的叶节点数据
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

    // 获取当前树实例是否全选，返回 true/false
    STree.prototype.isSelectAll = function() {
        return this.getAllItemNodeInfo().length === this.getAllSelectItemInfo().length
    }
    STree.prototype.unSelectAll = function() {
        if(!this.rootNode) {
            return null
        }
        this.rootNode.unSelect()
    }

    // 全选所有叶节点
    STree.prototype.selectAll = function() {
        if(!this.rootNode) {
            return null
        }
        this.rootNode.select();
    }
    // 取消选中全部
    STree.prototype.unSelectAll = function() {
        if(!this.rootNode) {
            return null
        }
        this.rootNode.unSelect();
    }

    /* 选取指定节点
     * itemList：要选择的叶子节点的 id 数组，如 [2,3,5]
     */
    STree.prototype.selectItems = function(itemList) {
        this.resetData(null, {
            defaultSelects: itemList
        })
    },

    // 销毁整颗数，包括左右节点实例和数据，请勿直接将实例引用置为 null，这样做会引起内存泄漏
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


/********** 下面的类的实例不会暴露到 window 上 ******************************************************************/

    /* 树的 node 接口类 ***************************************************/
    var STreeNode = function (name, id, type, option) {
        this.name = name;
        this.id = id;
        this.type = type;  // 'group | item | root'
        this.element = null;
        this.checkBoxEle = null;
        this.isSelect = false;
        this.childrenList = [];
        this.parentNode = null;
        this.option = option

        this.onSelectChange =  option.onSelectChange
        this.onShowChange =  option.onShowChange
    }
    STreeNode.prototype._addNode = function(child){
        child.parentNode = this;
        this.childrenList.push(child);
        this.childElement.appendChild(child.element);
        if(!child.isSelect && child.parentNode.isSelect) {
            child.parentNode.unSelectSelf()
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
        if(this.parentNode) {
            this.parentNode._childSelectChange(this.id, this.isSelect)
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
        if(this.parentNode) {
            this.parentNode._childSelectChange(this.id, this.isSelect)
        }
    };
    STreeNode.prototype.getNodeInfo = function() {
        return {
            name: this.name,
            id: this.id
        }
    }
    STreeNode.prototype.unSelectRootTree = function() {
        if(this.type == 'root') {
            this.unSelect();
        }else {
            this.parentNode.unSelectRootTree();
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


    /* 树的 group node 类 *********************************************************/
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
        if(!this.option.singleSelect) {
            itemEle.appendChild(labelEle);
        }
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
        if(this.parentNode) {
            this.parentNode.show()
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
        if(this.parentNode) {
            this.parentNode._childSelectChange(this.id, this.isSelect)
        }
    };
    STreeGroupNode.prototype.unSelectSelf = function(){  //group
        this.checkBoxEle.removeAttribute("checked")
        this.isSelect = false;
        if(this.type === 'item') {
            this.onSelectChange(this)
        }
        if(this.parentNode) {
            this.parentNode._childSelectChange(this.id, this.isSelect)
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

    /* 树的 item node 类 *****************************************************/
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
        this.element.appendChild(itemEle);
        itemEle.appendChild(labelEle);

        itemEle.onclick = function(event) {
            if(this.isSelect) {
                this.unSelect();
            }else {
                if(this.option.singleSelect) {
                    this.unSelectRootTree()
                }
                this.select();
            }
        }.bind(this)
    }
    extend(STreeItemNode, STreeNode);

    /* 树的 root node 类 ***************************************************/
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
        if(!this.option.singleSelect) {
            itemEle.appendChild(labelEle);
        }
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