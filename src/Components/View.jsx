import React, { useState, useEffect, useRef  } from 'react';
import axios from 'axios'
import * as d3 from 'd3'


import {view1_colorScheme, view1_area_color, view1_stroke_color} from "../function/view1_colorScheme";


function View(props){


    const param_algo = props.param_algo || 'example'


    ///////////////////// 声明一些 State 和 Ref /////////////////////////


    //定义是否mount的ref
    const didMount = useRef(false)

    // 数据存这儿
    let data = useRef({})


    let layout_attribute = useRef({
        'view1_height': 120,
        'view2_height': 450,
        'margin_top': 20,
        'margin_left': 30,
        'padding_top': 20,
        'padding_left': 30,

        'gap_view1_view2': 45,

        'view_title_height': 35
    })

    let selectArr = useRef([])







    ///////////////////////  View 1 的画图函数  /////////////////////

    function draw_view1(data){

        // 定义布局变量
        const layout = layout_attribute.current
        const view1_width = 1700, view1_height = layout['view1_height']
        const view1_margin_top = layout['margin_top'], view1_margin_left = layout['margin_left']
        const view1_padding_top_bottom = layout['padding_top'], view1_padding_left_right = layout['padding_left']
        const view1_title_width = 150, view1_title_height = layout['view_title_height']



        // 定义元素的长和宽
        const content_width = view1_width - 2*view1_padding_left_right
        const heading_height = 20, tag_gap = 7
        const view1_label_width = 40, view1_label_height = 25
        const gap_heading_area = 10






        ////////////////// 开始构造View1的数据 //////////////

        let step_data = [] //每一个step的数据都放这里

        Object.entries(data).map(d0=>{
            let [block_name, block_value] = d0

            Object.entries(block_value).forEach(_d0=>{
                let [step_name, step_value] = _d0

                let name = `${block_name}_${step_name}`

                step_data.push({"step_name": name, "block": block_name, ...step_value})
            })
        })


        let view1_data = step_data.map(d=>{

            let gate = d['hubs']['statehub0']['states']['state0']['post_gate'] || 'unknown'

            let state_pr_arr = {}
            Object.values(d['hubs']).forEach(_d=>{
                Object.values(_d['states']).forEach(__d=>{


                    state_pr_arr[`s_${__d['state']}`] = {
                        'state': __d['state'],
                        'prob': _d['probability']
                    }

                })
            })

            return {
                "block": d['block'],
                "step": d['step_name'],
                "gate": gate,
                "states": state_pr_arr
            }
        })





        // 创建 view1 的selection
        let view1 = d3.select('.svg')
            .append('g')
            .attr('class', 'view1')
            .attr('transform', `translate(${view1_margin_top}, ${view1_margin_left})`)



        // 生成 每一个 step 的单位块， 叫做 block
        let block_width = content_width / (step_data.length)
        let heading_width = block_width - tag_gap





        // 画View1的上方的坐标轴

        let axis_bottom_count = 0

        let temp_arr = Object.values(data)
        temp_arr.pop()// 去除最后一个元素，因为没有对应的gate

        let steps_arr = temp_arr.reduce((arr, cur)=>{
            let temp_arr = []

            Object.keys(cur).forEach(d=>{
                temp_arr.push(axis_bottom_count)
                axis_bottom_count = axis_bottom_count+1
            })

            let position = 0
            if(temp_arr.length==0){
                position = temp_arr[0]
            }else{
                position = (d3.extent(temp_arr)[1]+1 + d3.extent(temp_arr)[0])/2
            }

            arr.push(position)

            return arr
        },[])






        // heading是每个方块的个体
        let heading_g = view1.append('g')
            .attr('class', 'view1_heading')
            .attr('transform', `translate(${view1_padding_left_right}, ${view1_title_height+view1_padding_top_bottom})`)




        // 画 view1 的axis
        let scaleX = d3.scaleLinear()
            .domain([0, axis_bottom_count])
            .range([0, content_width-block_width]) /*TODO: 这里不知道为什么加了-block_width就work了，可能以后会出bug*/




        heading_g.append('g')
            .attr('class', 'view1_axisBottom')
            .attr('transform', `translate(${0}, ${-10})`)
            .call(d3.axisTop(scaleX)
                .tickValues(steps_arr)
                .tickFormat((_, i)=>`Block ${i+1}`)
            )






        let rects = heading_g.selectAll('.null')
            .data(view1_data.reduce((arr, d)=>{
                if (d['gate'] !== 'unknown'){
                    arr.push(d)
                    return arr
                }
                return arr
            }, []))
            .join('g')
            .attr('class', d=>d['step'])
            .attr('transform', (d,i)=>`translate(${i * block_width},${0})`)



        // 画上方的 代表 step 和 gate 的 heading


        rects
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', heading_width)
            .attr('height', heading_height)
            // .attr('rx', rx)
            .attr('fill', (d,i)=>view1_colorScheme[(d['block'].match(/\d+$/)[0])%8])
            // .attr('stroke', "#2f2f2f")
            // .attr('stroke-width', '1px')




        rects.append('text')
            .html(d=>d['gate'])
            .attr('transform', `translate(${heading_width/2.2}, ${heading_height/1.3})`)
            .style('font-size', '1.2em')
            // .style('font-weight', 'bold')
            // .style('font-style', 'italic')
            .style('fill', '#444444')



        //////////// 画下面的 stacked area chart ////////////

        // 构造 keys 数据
        let keys = view1_data.reduce(function(arr, d){
            Object.values(d['states']).forEach(_d=>{
                if(!arr.includes(_d['state'])){
                    arr.push(_d['state'])
                }
            })
            return arr
        }, [])
            .sort()



        let values = view1_data.map(d=>{

            let obj = {}

            keys.forEach(_d=>{

                obj[_d] = d['states'][`s_${_d}`]? d['states'][`s_${_d}`]['prob'] : 0

            })

            obj['block'] = d['block']
            obj['step'] = d['step']

            return obj
        })



        let area_g = view1.append('g')
            .attr('transform', `translate(${view1_padding_left_right}, ${view1_title_height+view1_padding_top_bottom+heading_height+gap_heading_area})`)
            .attr('class', 'area_chart')


        let view1_x = d3.scaleLinear()
            .domain([0, view1_data.length])
            .range([0, content_width])

        let view1_y = d3.scaleLinear()
            .domain([0, 1])
            .range([0, view1_height])


        let view1_state_colorScale = d3.scaleOrdinal()
            .domain(keys)
            .range(view1_stroke_color)

        let view1_state_areaColorScale = d3.scaleOrdinal()
            .domain(keys)
            .range(view1_area_color)



        // 用values构造d3.stack数据
        let stacked_data = d3.stack().keys(keys)(values)



        area_g.selectAll('.null')
            .data(stacked_data)
            .join('path')
            .style('fill', (d,i)=>view1_state_areaColorScale(d['key']))
            .attr('d', d3.area()
                .curve(d3.curveBumpX)
                .x(function(d,i) { return view1_x(i); })
                .y0(function(d) { return view1_y(d[0]); })
                .y1(function(d) { return view1_y(d[1]); }))




        // 画每个step之间的竖线


        let temp = area_g.selectAll('.null')
            .data(stacked_data)
            .join('g')
            .attr('class', d=>`${d['key']}`)
            .attr('id', d=>`colorIndex-${d['key']}`)
            .selectAll('.null')
                .data(d=>d)
                .join('line')
                .attr('x1', (d,i)=>i*block_width)
                .attr('y1', d=>view1_y(d[0]))
                .attr('x2', (d,i)=>i*block_width)
                .attr('y2', d=>view1_y(d[1]))
                .style('stroke', function(x){
                    return view1_state_colorScale(+d3.select(this).node().parentNode.getAttribute('id').split('-')[1])
                })
                .style('stroke-width', 3)





        // 画area之间的空白的缝隙
        let gap_data = stacked_data.map(d=>d.map(_d=>_d[1]))
        gap_data.pop() // 去除最后一个元素，本来是最上面的那一条线 （e.g. [1,1,1,1,1,1,1,1,1,1,1,1]）


        area_g.selectAll('.null')
            .data(gap_data)
            .join('path')
            .attr("fill", "none")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 4)
            .attr('d', d3.line()
                .curve(d3.curveBumpX)
                .x((d,i)=>view1_x(i))
                .y((d,i)=>view1_y(d))
            )





        // 画新生的state的标识label
        let view1_label_data = stacked_data.map(d=>{

            let start_points = []
            d.reduce((prev, cur, i)=>{

                let diff_prev = prev[1] - prev[0]
                let diff_cur = cur[1]  - cur[0]
                let index = 0

                // 主要针对起始的那种状态
                if(i==1 && diff_prev==1){
                    index = i-1
                    start_points.push([0, 0, prev.data, index, d['key']])
                }

                if(diff_prev==0 && diff_cur>0){
                    index = i-1
                    start_points.push([...prev, prev.data, index, d['key']])
                }

                return cur
            })

            return start_points
        })



        let temp_obj = {}
        view1_label_data.flat().forEach(d=>{

            let name = `s${`${d[1]}`.replace(/[,.-]/g, '')}-${`${d[3]}`.replace(/[,.-]/g, '')}`

            if(Object.keys(temp_obj).includes(name)){
                temp_obj[name].push(d)
            }else{
                temp_obj[name] = [d]
            }
        })



        let area_label = area_g.append('g')
            .attr('class', `view1_label`)
            .selectAll('.null')
            .data(Object.values(temp_obj))
            .join('g')
            .attr('transform', (d,i)=>`translate(${view1_x(d[0][3])}, ${view1_y(d[0][1])})`)



        let area_label_g = area_label
            .selectAll('.null')
            .data(d=>d)
            .join('g')
            .attr('transform', (d,i)=>(`translate(${-view1_label_width/2},${(i-1)*view1_label_height})`))



        area_label_g
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', view1_label_width)
            .attr('height', view1_label_height)
            .attr('fill', '#ffffff')
            .attr('stroke', d=>view1_state_colorScale(d[4]))
            .attr('stroke-width',3)
            .attr('rx', 4)



        area_label_g.append('text')
            .html(d=>`|${ d[4]}&#x27E9`)
            .attr('transform', `translate(${view1_label_width/5}, ${view1_label_height/1.4})`)
            .style('font-size', '1.1em')
            .style('fill', d=>view1_state_colorScale(d[4]))
            .style('font-weight', 'bold')




        // 画这个View的 title
        let view_title = view1.append('g')
            .attr('class', 'view_title')
            .attr('transform', `translate(${view1_margin_left+20}, ${view1_margin_top})`)


        view_title
            .append('text')
            .html(`View Name`)
            .attr('transform', `translate(${40}, ${0})`)
            .attr('class', 'view_title_text')


        // icon
        view_title
            .append('text')
            .attr('transform', `translate(${0}, ${0})`)
            .attr("class", "fas view_title_icon")
            .text('\uf1fe');


        // border
        view_title.append('rect')
            .attr('x', -9)
            .attr('y', -33)
            .attr('width', 224)
            .attr('height', 44)
            // .attr('rx', 5)
            .attr('fill', 'none')
            .attr('stroke', "#2f2f2f")
            .attr('stroke-width', '2px')




    }






    ///////////////////////// View 2 的画图函数 ///////////////////////
    function draw_view2(data){


        // 定义 布局 变量
        const layout = layout_attribute.current
        const view2_width = 1550, view2_height = layout['view2_height']
        const view2_margin_top = 3*layout['margin_top']+layout['view1_height']+layout['view_title_height']+2*layout['padding_top'], view2_margin_left = layout['margin_left']
        const view2_padding_top_bottom = layout['padding_top'], view2_padding_left_right = layout['padding_left']
        const view_title_height = layout['view_title_height']
        const gap_view1_view2 = layout['gap_view1_view2']



        const content_width = view2_width - 2*view2_padding_left_right
        const bottomAxis_top = view2_height - 2*view2_padding_top_bottom



        // 定义元素的长和宽
        const state_width =60, state_height = 20
        const gateCircle_radius = 10, gate_offset = 25
        const rx = state_height/4
        const gap_width = 5



        // 定义元素的颜色
        const view2_bgColor_0 = '#f5f5f5', view2_bgColor_1 = '#ffffff'// view2 的背景两种相间的颜色
        const view2_stateColor_positive = "#a5dcfd", view2_stateColor_negative = '#5fb2dc' // state元素的正和负的颜色
        const view2_linkColor = "#f8a1ac", view2_linkColor_hover = '#e35555' // link的颜色
        const view2_hubColor = "#666666" // hub的边框颜色
        const view2_link_width = '2px'




        let view2 = d3.select('.svg')
            .append('g')
            .attr('class', 'view2')
            .attr('transform', `translate(${view2_margin_left}, ${gap_view1_view2+view2_margin_top})`)



        let chart_g = view2.append('g')
            .attr('transform', `translate(${view2_padding_left_right+20}, ${view2_padding_top_bottom+view_title_height+20})`)




        //////////////////画 axis-bottom 的坐标////////////

        // 计算axis—bottom的坐标值，要求是把每组block整个画，把多个step的位置空出来
        let axis_bottom_count = 0
        let steps_arr = Object.values(data).reduce((arr, cur)=>{
            let temp_arr = []

            Object.keys(cur).forEach(d=>{
                temp_arr.push(axis_bottom_count)
                axis_bottom_count = axis_bottom_count+1
            })

            let position = 0
            if(temp_arr.length==0){
                position = temp_arr[0]
            }else{
                position = (d3.extent(temp_arr)[1]+1 + d3.extent(temp_arr)[0])/2
            }

            arr.push(position)

            return arr
        },[])





        let scaleX = d3.scaleLinear()
            .domain([0, axis_bottom_count])
            .range([0, view2_width - 2*view2_padding_left_right])


        chart_g.append('g')
            .attr('class', 'view2_axisBottom')
            .attr('transform', `translate(${0}, ${-20})`)
            .call(d3.axisTop(scaleX)
                .tickValues(steps_arr)
                .tickFormat((_, i)=>`Block ${i+1}`)
            )





        ///////////// 画 axis-left 的坐标轴//////////////////

        let scaleY = d3.scaleLinear()
            .domain([100, 0])
            .range([0, view2_height - 2*view2_padding_top_bottom])

        chart_g.append('g')
            .attr('class', 'view2_axisLeft')
            .attr('transform', `translate(${-15}, ${0})`)
            .call(d3.axisLeft(scaleY)
                .tickValues([0, 25, 50, 75, 100])
                .tickFormat(d=>`${d}%`)
            )










        ////////////// 画 里面的 View2 的主视图///////////////



        let step_data = [] //每一个step的数据都放这里

        Object.entries(data).map(d=>{
            let [block_name, block_value] = d

            Object.entries(block_value).forEach(_d=>{
                let [step_name, step_value] = _d

                let name = `${block_name}_${step_name}`

                step_data.push({"step_name": name, "block": block_name, ...step_value})
            })
        })



        // 生成 每一个step的单位块， 叫做block
        let block_width = content_width / (step_data.length)




        // 画block的灰白相间的背景
        chart_g.append('g')
            // .attr('transform', `translate(${view2_padding_left_right}, ${view2_padding_top_bottom})`)
            .selectAll('.null')
            .data(step_data)
            .join('rect')
            .attr('x', (d,i)=> i*block_width)
            .attr('y',  - state_height/2)
            .attr('width', block_width)
            .attr('height', view2_height - 2*view2_padding_top_bottom)
            // .attr('fill', d=>+d['block'].match(/\d+$/)[0] % 2 == 0? 'rgb(250,250,250)': '#ffffff')
            .attr('fill', d=>+d['block'].match(/\d+$/)[0] % 2 == 0? view2_bgColor_0: view2_bgColor_1)





        let block = chart_g.selectAll('.step')
            .data(step_data)
            .join('g')
            .attr('class', d=>d['block'])
            .attr('transform', (d, i)=>{
                let y = 0
                let x = 0 + i*block_width

                return `translate(${x}, ${y})`
            })


        // 画代表概率相同的 一大块（hub)



        // 画每个hub的 方框
        const hub_width = state_width + 2*gap_width, hub_height = state_height+gap_width // height多出来的4是缝隙
        const refLine_cap = 8



        let hub = block
            .selectAll('.null')
            .data(d=>{

                let arr = Object.keys(d['hubs']).map(_d=>{
                    return `${d['step_name']}_${_d}`
                })

                return Object.values(d['hubs']).map((d,i)=>{
                    return {'name': arr[i], ...d}
                })
            })
            .join('g')
            .attr('class', d=>d['name'])
            .attr('transform', d=>`translate(${5}, ${scaleY(d['probability']*100)-Object.keys(d['states']).length * state_height/2})`)




        // 画hub的对齐的突出的一小截儿
        hub.append('line')
            .attr('x1', -refLine_cap)
            .attr('y1', d=>(Object.keys(d['states']).length * hub_height-gap_width)/2)
            .attr('x2', state_width+refLine_cap+2*gap_width)
            .attr('y2', d=>(Object.keys(d['states']).length * hub_height-gap_width)/2)
            .style('stroke', view2_hubColor)
            .style('stroke-width', 3)
            .style('stroke-linecap', 'round')





        hub.append('rect')
            .attr('x', 0)
            .attr('y', -gap_width)
            .attr('width', hub_width)
            .attr('height', d=>Object.keys(d['states']).length * hub_height+gap_width)
            .attr('rx', rx)
            .attr('stroke', view2_hubColor)
            .attr('stroke-width', '2px')
            .attr('fill', '#ffffff')
            // .attr('fill', '#e5e5e5')




        // 画每个state的容器
        let state_g = hub
            .selectAll(`.hub`)
            .data(d=>{
                return Object.entries(d['states']).map(_d=>{
                    return {
                        'name': `${d['name']}_${_d[0]}`,
                        ..._d[1]
                    }
                })
            })
            .join('g')
            .attr('transform', (d,i)=>`translate(${gap_width}, ${(state_height+gap_width)*i})`)
            .style('cursor', 'pointer')



        state_g
            .append('rect')
            .attr('class', d=>d['token'])
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', state_width)
            .attr('height', state_height)
            .attr('rx', rx)
            .attr('fill', d=>d['positive']? view2_stateColor_positive:view2_stateColor_negative)





        // 开始画state的连线

        // let selectArr = [] // 存放所有 link 的classname

        let link = state_g.selectAll('.path')
            .data(d=>{

                if(d['children']==false){
                    return []
                }

                return d['children'].map(_d=>{
                    return {
                        'current': d['token'],
                        'target': _d
                    }
                })

            })
            .join('path')
            .attr("d", function(d, i){

                // let target = d3.select(`.${d['target']}`).node()
                // let target_parent = d3.select(`.${d['target']}`).node().parentNode
                // let target_X = +target_parent_parent.getAttribute('transform').split(/[\s,()]+/)[1]

                let current_X =d3.select(`.${d['current']}`).node().getBoundingClientRect()['x']
                let current_Y =d3.select(`.${d['current']}`).node().getBoundingClientRect()['y']
                let target_X =d3.select(`.${d['target']}`).node().getBoundingClientRect()['x']
                let target_Y =d3.select(`.${d['target']}`).node().getBoundingClientRect()['y']



                let x0 = hub_width
                let y0 = hub_height / 2
                let x1 = target_X - current_X
                let y1 = target_Y - current_Y + hub_height / 2


                return "M" + x0 + "," + y0
                    + " " + (x0+gate_offset) + "," + y0
                    + "C" + (x0+50) + "," + y0
                    + " " + (x1-20) + "," + y1
                    + " " + x1 + "," + y1;
            })
            .attr('class', d=>{

                let class_name = `${d['current']}-${d['target']}`

                selectArr.current.push(class_name)

                return class_name
            }) // e.g., class = "block0_step1_state0-block0_step0_temp"
            .attr('id', 'path')
            .attr('fill', 'none')
            .attr('stroke', view2_linkColor)
            .attr('stroke-width', view2_link_width)
            .attr('stroke-dasharray', 5)






        // 生成每个state 里面的text
        state_g.append('text')
            .html(d=>`|${ d['state']}&#x27E9`)
            .attr('transform', `translate(${state_width/3}, ${state_height/1.4})`)
            .style('font-size', '1.2em')
            .style('fill', '#ffffff')




        // 画每个state后面跟的作用门
        let gate_g = state_g.append('g')
            .attr('transform', `translate(${state_width + gate_offset}, ${state_height/2})`)
            .attr('class', "gate_g")




        gate_g.append('circle')
            .attr("r", gateCircle_radius)
            .attr("cx", 0)
            .attr("cy", 0)
            .style("stroke", "gray")
            .style("stroke-width", 2)
            .style("fill", "#ffffff")




        gate_g.append('text')
            .html(d=>d['post_gate'])
            .attr('transform', `translate(${-gateCircle_radius/2}, ${gateCircle_radius/2.5})`)
            .style('font-size', '1.1em')
            .style('font-weight', 'bold')
            .style('font-style', 'italic')
            .style('fill', '#636363')




        // 画这个View的 title
        let view_title = view2.append('g')
            .attr('class', 'view_title')
            .attr('transform', `translate(${view2_padding_left_right+10}, ${view2_padding_top_bottom})`)



        view_title
            .append('text')
            .html(`View Name`)
            .attr('transform', `translate(${45}, ${0})`)
            .attr('class', 'view_title_text')


        // icon
        view_title
            .append('text')
            .attr('transform', `translate(${0}, ${0})`)
            .attr("class", "fa view_title_icon")
            .text('\uf542');



        // border
        view_title.append('rect')
            .attr('x', -9)
            .attr('y', -35)
            .attr('width', 225)
            .attr('height', 46)
            // .attr('rx', 5)
            .attr('fill', 'none')
            .attr('stroke', "#2f2f2f")
            .attr('stroke-width', '2px')





        //////////////////////////  交互 interaction ///////////////////////////////




        let before_arr = [] // 存放所有state before的links
        let after_arr = [] // 存放所有after before的links

        // 给state绑定 hover 的交互 ---- 出现前方的所有的link的加粗的线
        state_g.on('mouseover', (d, item)=>{

            let data = selectArr.current

            let before_arr = func_query_before(data, item['token'], [])

            link.filter(function(d,i,t){

                return before_arr.includes(this.getAttribute('class'))
            })
                .attr('stroke', view2_linkColor_hover)
                .attr('stroke-width', '3px')
                .attr('stroke-dasharray', 'none')


        })



        // 给state绑定 hover 的交互 ---- 移除前方的所有的link的加粗的线
        state_g.on('mouseout', (d, item)=>{

            link.attr('stroke', view2_linkColor)
                .attr('stroke-width', view2_link_width)
                .attr('stroke-dasharray', 5)

        })


        // 给hub绑定hover的交互 ---- 出现 reference line
        hub.on('mouseover', function(d, item){



            let left_point = d3.select(`.${item['name']}`).node().parentNode.getAttribute('transform').split(/[\s,()]+/)[1]

            let right_point = view2_width - left_point - hub_width + view2_padding_left_right


            d3.select(`.${item['name']}`)
                .append('line')
                .attr('x1', -left_point+view2_padding_left_right)
                .attr('y1', d=>(Object.keys(d['states']).length * hub_height-gap_width)/2)
                .attr('x2', 0)
                .attr('y2', d=>(Object.keys(d['states']).length * hub_height-gap_width)/2)
                .style('stroke', '#424242')
                .style('stroke-width', 1)
                .attr('stroke-dasharray', 4)
                .attr('class', 'ref_line')



            d3.select(`.${item['name']}`)
                .append('line')
                .attr('x1', hub_width)
                .attr('y1', d=>(Object.keys(d['states']).length * hub_height-gap_width)/2)
                .attr('x2', right_point)
                .attr('y2', d=>(Object.keys(d['states']).length * hub_height-gap_width)/2)
                .style('stroke', '#424242')
                .style('stroke-width', 1)
                .attr('stroke-dasharray', 4)
                .attr('class', 'ref_line')


            })

        // 给hub绑定hover的交互 ---- 隐藏 reference line
        hub.on('mouseout', function(){
            d3.selectAll('.ref_line')
                .remove()
        })







    }



    // 查找所有前方的路径
    function func_query_before(data, root_names, initial_arr){


        if(typeof root_names == 'string'){//第一次还是 点击的一个值的时候

            let temp_arr = []

            data.forEach(d=>{
                let [_a, tail] = d.split('-')

                if(tail == root_names){
                    initial_arr.push(d)
                    temp_arr.push(_a)

                }
            })


            return func_query_before(data, temp_arr, initial_arr)


        }else{// 从第二次开始

            let temp_arr = []

            root_names.forEach(d=>{
                let [head, _] = d.split('-')

                data.forEach(_d=>{
                    let [_a, tail] = _d.split('-')

                    if(tail == head){
                        initial_arr.push(_d)
                        temp_arr.push(_a)
                    }
                })
            })

            if(temp_arr.length == 0){
                return initial_arr
            }

            return func_query_before(data, temp_arr, initial_arr)
        }
    }









    //请求数据函数，基于请求到的数据 调用 render_view 画图
    function render_from_data(){

        axios.get(`data/qiskit_grover_2q.json`)
        // axios.get(`data/temp.json`)
            .then(res=>{

                data.current = res.data

                render_view(data.current)
            })

    }










    //画图函数
    function render_view(data){

        const svg_width = 1600, svg_height = 1100


        // 绘制 画布
        const svg = d3.select('#svgContainer')
            .append('svg')
            .attr('width', svg_width)
            .attr('height', svg_height)
            .classed('svg', true)


        // 绘制 view1
        draw_view1(data)


        // 绘制 view2
        draw_view2(data)

    }











    // mount 的时候渲染一次
    useEffect(()=>{

        render_from_data()

    }, [])



    // 当 algo 更新的时候update
    useEffect(()=>{


        // 跳过第一次 mount
        if(!didMount.current){
            didMount.current = true

            return
        }


        // 绘制 view2
        console.log('View1 update')



    }, [param_algo])





    return (
        <div id="svgContainer"></div>
    )

}

export default View