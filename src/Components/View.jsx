import React, { useState, useEffect, useRef  } from 'react';
import axios from 'axios'
import * as d3 from 'd3'


import {view1_colorScheme, view1_area_color, view1_stroke_color} from "../function/view1_colorScheme";
import {state_light, state_color_point, state_dark, state_Light} from "../function/color_scheme";


function View(props) {




    // 获取要渲染的 algo
    const param_algo = props.param_algo


    ///////////////////// 声明一些 State 和 Ref /////////////////////////


    //定义是否mount的ref
    const didMount = useRef(false)

    // 数据存这儿
    let data = useRef({})


    let layout_attribute = useRef({
        'view1_height': 90,
        'view2_height': 320,
        'margin_top': 20,
        'margin_left': 30,
        'padding_top': 20,
        'padding_left': 20,

        'gap_view1_view2': 30,

        'view_title_height': 0
    })

    let selectArr = useRef([])


    ///////////////////// 定义颜色 //////////////////////
    const color_null = '#444444', color_h = '#e08080', color_x = '#d7c662', color_s = '#44b8b8'
    const color_cx = '#6b84c2', color_cx_control_on='#73cb6f', color_cx_control_off='#894949'


    ///////////////////////  View 1 的画图函数  /////////////////////

    function draw_view1(data) {

        // 定义布局变量
        const layout = layout_attribute.current
        const view1_width = 1250, view1_height = layout['view1_height']
        const view1_margin_top = layout['margin_top'], view1_margin_left = layout['margin_left']
        const view1_padding_top_bottom = layout['padding_top'], view1_padding_left_right = layout['padding_left']
        const view1_title_width = 150, view1_title_height = layout['view_title_height']


        // 定义元素的长和宽
        const content_width = view1_width - 2 * view1_padding_left_right
        const heading_height = 20, tag_gap = 7
        const view1_label_width = 30, view1_label_height = 20
        const gap_heading_area = 10


        ////////////////// 开始构造View1的数据 //////////////

        let step_data = [] //每一个step的数据都放这里

        Object.entries(data).map(d0 => {
            let [block_name, block_value] = d0

            Object.entries(block_value).forEach(_d0 => {
                let [step_name, step_value] = _d0

                let name = `${block_name}_${step_name}`

                step_data.push({"step_name": name, "block": block_name, ...step_value})
            })
        })


        let view1_data = step_data.map(d => {

            let gate = d['hubs']['statehub0']['states']['state0']['post_gate'] || 'unknown'

            let state_pr_arr = {}
            Object.values(d['hubs']).forEach(_d => {
                Object.values(_d['states']).forEach(__d => {


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

        let steps_arr = temp_arr.reduce((arr, cur) => {
            let temp_arr = []

            Object.keys(cur).forEach(d => {
                temp_arr.push(axis_bottom_count)
                axis_bottom_count = axis_bottom_count + 1
            })

            let position = 0
            if (temp_arr.length == 0) {
                position = temp_arr[0]
            } else {
                position = (d3.extent(temp_arr)[1] + 1 + d3.extent(temp_arr)[0]) / 2
            }

            arr.push(position)

            return arr
        }, [])




        // heading是每个方块的个体
        let heading_g = view1.append('g')
            .attr('class', 'view1_heading')
            .attr('transform', `translate(${view1_padding_left_right}, ${view1_title_height + view1_padding_top_bottom})`)


        // 画 view1 的axis
        let scaleX = d3.scaleLinear()
            .domain([0, axis_bottom_count])
            .range([0, content_width - block_width]) /*TODO: 这里不知道为什么加了-block_width就work了，可能以后会出bug*/


        heading_g.append('g')
            .attr('class', 'view1_axisBottom')
            .attr('transform', `translate(${0}, ${-10})`)
            .call(d3.axisTop(scaleX)
                .tickValues(steps_arr)
                .tickFormat((_, i) => `Block ${i + 1}`)
            )


        let rects = heading_g.selectAll('.null')
            .data(view1_data.reduce((arr, d) => {
                if (d['gate'] !== 'unknown') {
                    arr.push(d)
                    return arr
                }
                return arr
            }, []))
            .join('g')
            .attr('class', d => d['step'])
            .attr('transform', (d, i) => `translate(${i * block_width},${0})`)


        // 画上方的 代表 step 和 gate 的 heading


        rects
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', heading_width)
            .attr('height', heading_height)
            // .attr('rx', rx)
            .attr('fill', (d, i) => view1_colorScheme[(d['block'].match(/\d+$/)[0]) % 8])
        // .attr('stroke', "#2f2f2f")
        // .attr('stroke-width', '1px')


        rects.append('text')
            .html(d => d['gate'])
            .attr('transform', `translate(${heading_width / 2.2}, ${heading_height / 1.3})`)
            .style('font-size', '1.2em')
            // .style('font-weight', 'bold')
            // .style('font-style', 'italic')
            .style('fill', '#444444')


        //////////// 画下面的 stacked area chart ////////////

        // 构造 keys 数据
        let keys = view1_data.reduce(function (arr, d) {
            Object.values(d['states']).forEach(_d => {
                if (!arr.includes(_d['state'])) {
                    arr.push(_d['state'])
                }
            })
            return arr
        }, [])
            .sort()



        let values = view1_data.map(d => {

            let obj = {}

            keys.forEach(_d => {

                obj[_d] = d['states'][`s_${_d}`] ? d['states'][`s_${_d}`]['prob'] : 0

            })

            obj['block'] = d['block']
            obj['step'] = d['step']

            return obj
        })




        let area_g = view1.append('g')
            .attr('transform', `translate(${view1_padding_left_right}, ${view1_title_height + view1_padding_top_bottom + heading_height + gap_heading_area})`)
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


        // 画area chart
        area_g.selectAll('.null')
            .data(stacked_data)
            .join('path')
            // .each(d=>{
            //     console.log(d['key'])
            // })
            .style('fill', (d, i) => state_Light[d['key']])
            .attr('d', d3.area()
                .curve(d3.curveBumpX)
                .x(function (d, i) {
                    return view1_x(i);
                })
                .y0(function (d) {
                    return view1_y(d[0]);
                })
                .y1(function (d) {
                    return view1_y(d[1]);
                }))


        // 画每个step之间的竖线


        // view1_step_line是brush所识别的目标
        let view1_step_line = area_g.selectAll('.null')
            .data(stacked_data)
            .join('g')
            .attr('class', d => `${d['key']}`)
            .attr('id', d => `colorIndex-${d['key']}`)
            .selectAll('.null')
            .data(d => d)
            .join('line')
            .attr('x1', (d, i) => i * block_width)
            .attr('y1', d => view1_y(d[0]))
            .attr('x2', (d, i) => i * block_width)
            .attr('y2', d => view1_y(d[1]))
            .style('stroke', function (x) {
                return state_dark[d3.select(this).node().parentNode.getAttribute('id').split('-')[1]]
            })
            .style('stroke-width', 3)


        // 画area之间的空白的缝隙
        let gap_data = stacked_data.map(d => d.map(_d => _d[1]))
        gap_data.pop() // 去除最后一个元素，本来是最上面的那一条线 （e.g. [1,1,1,1,1,1,1,1,1,1,1,1]）


        area_g.selectAll('.null')
            .data(gap_data)
            .join('path')
            .attr("fill", "none")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 4)
            .attr('d', d3.line()
                .curve(d3.curveBumpX)
                .x((d, i) => view1_x(i))
                .y((d, i) => view1_y(d))
            )


        // 画新生的state的标识label
        let view1_label_data = stacked_data.map(d => {

            let start_points = []
            d.reduce((prev, cur, i) => {

                let diff_prev = prev[1] - prev[0]
                let diff_cur = cur[1] - cur[0]
                let index = 0

                // 主要针对起始的那种状态
                if (i == 1 && diff_prev == 1) {
                    index = i - 1
                    start_points.push([0, 0, prev.data, index, d['key']])
                }

                if (diff_prev == 0 && diff_cur > 0) {
                    index = i - 1
                    start_points.push([...prev, prev.data, index, d['key']])
                }

                return cur
            })

            return start_points
        })


        let temp_obj = {}
        view1_label_data.flat().forEach(d => {

            let name = `s${`${d[1]}`.replace(/[,.-]/g, '')}-${`${d[3]}`.replace(/[,.-]/g, '')}`

            if (Object.keys(temp_obj).includes(name)) {
                temp_obj[name].push(d)
            } else {
                temp_obj[name] = [d]
            }
        })


        let area_label = area_g.append('g')
            .attr('class', `view1_label`)
            .selectAll('.null')
            .data(Object.values(temp_obj))
            .join('g')
            .attr('transform', (d, i) => `translate(${view1_x(d[0][3])}, ${view1_y(d[0][1])})`)


        let area_label_g = area_label
            .selectAll('.null')
            .data(d => d)
            .join('g')
            .attr('transform', (d, i) => (`translate(${-view1_label_width / 2},${(i - 1) * view1_label_height})`))


        area_label_g
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', view1_label_width)
            .attr('height', view1_label_height)
            .attr('fill', '#ffffff')
            .attr('stroke', d => state_dark[d[4]])
            .attr('stroke-width', 2)
            .attr('rx', 4)


        area_label_g.append('text')
            .html(d => `|${d[4]}&#x27E9`)
            .attr('transform', `translate(${view1_label_width / 5}, ${view1_label_height / 1.4})`)
            .style('font-size', '0.8em')
            .style('fill', d => state_dark[d[4]])
            .style('font-weight', 'bold')



        ///////////////// 测试 brushing ////////////////

        let myBrush = d3.brushX()
            .extent( [ [-30,-30], [view1_width,view1_height+3*view1_margin_top+2*view1_padding_top_bottom+view1_title_height-20] ] )
            .on('end', brush_function)


        view1
            .call(myBrush)





        // // 画这个View的 title
        // let view_title = view1.append('g')
        //     .attr('class', 'view_title')
        //     .attr('transform', `translate(${view1_margin_left + 20}, ${view1_margin_top})`)


        // view_title
        //     .append('text')
        //     .html(`View Name`)
        //     .attr('transform', `translate(${40}, ${0})`)
        //     .attr('class', 'view_title_text')
        //
        //
        // // icon
        // view_title
        //     .append('text')
        //     .attr('transform', `translate(${0}, ${0})`)
        //     .attr("class", "fas view_title_icon")
        //     .text('\uf1fe');
        //
        //
        // // border
        // view_title.append('rect')
        //     .attr('x', -9)
        //     .attr('y', -33)
        //     .attr('width', 224)
        //     .attr('height', 44)
        //     // .attr('rx', 5)
        //     .attr('fill', 'none')
        //     .attr('stroke', "#2f2f2f")
        //     .attr('stroke-width', '2px')




        // view 1 的brush的函数
        function brush_function(event){

            // 删除view3
            d3.select('.view3')
                .remove()

            d3.selectAll('.view3_line')
                .remove()

            d3.selectAll('.bundle_container ')
                .remove()

            d3.select('.view_svg')
                .attr('width', 800)
                .attr('height', 360)



            const selection = event.selection

            const [startX1, startX2] = selection;

            // console.log(startX1, startX2)

            let selection_data = view1_step_line
                .filter(function(d){
                    let x0 = +this.getAttribute('x1')+view1_margin_left

                    // 算y1 y2的目的是有的元素尽管y1 y2重合，但还是存在view里，会被brushX选中
                    let y1 = +this.getAttribute('y1')
                    let y2 = +this.getAttribute('y2')

                    return x0>=startX1 && x0<=startX2-5 && y1!==y2
                })
                .data()
                .map(d=>{
                    return d['data']['step']
                })

            // 去重，得到最终的 step 的数据
            selection_data = [...new Set(selection_data)]


            /* 重新画 view2 */
            draw_view2(data, selection_data)






        }

    }


    ///////////////////////// View 2 的画图函数 ///////////////////////
    function draw_view2(data, brush_filter=[]) {


        // 如果之前存在view2，就清除掉
        d3.select('.view2')
            .remove()

        // 传入brush_filter的话，就处理数据
        if(brush_filter.length!==0){
            // console.log(data)
            // console.log(brush_filter)

            let obj = {}

            Object.entries(data).map(block=>{
                let block_name = block[0]
                let step = block[1]

                let obj2 = {}

                Object.entries(step).forEach(d=>{
                    let step_name = `${block_name}_${d[0]}`

                    if(brush_filter.includes(step_name)){
                        obj2[d[0]] = d[1]
                    }
                })

                // console.log(Object.keys(obj2))
                if(Object.keys(obj2).length!==0){
                    obj[block_name] = obj2
                }

            })

            data = obj
        }




        //////////// 获取参数 //////////
        console.log('View2 update')

        let change_statevector = props.change_statevector



        // 定义 布局 变量
        const layout = layout_attribute.current
        const view2_width = 1150, view2_height = layout['view2_height']
        const view2_margin_top = 3 * layout['margin_top'] + layout['view1_height'] + layout['view_title_height'] + 2 * layout['padding_top'],
            view2_margin_left = layout['margin_left']
        const view2_padding_top_bottom = layout['padding_top'], view2_padding_left_right = layout['padding_left']
        const view_title_height = layout['view_title_height']
        const gap_view1_view2 = layout['gap_view1_view2']


        const content_width = view2_width - 2 * view2_padding_left_right
        const bottomAxis_top = view2_height - 2 * view2_padding_top_bottom


        // 定义元素的长和宽
        const state_width = 45, state_height = 15
        const gateCircle_radius = 8, gate_offset = 18
        const rx = state_height / 4
        const gap_width = 4


        // 定义元素的颜色
        const view2_bgColor_0 = '#f5f5f5', view2_bgColor_1 = '#ffffff'// view2 的背景两种相间的颜色
        const view2_stateColor_positive = "#a5dcfd", view2_stateColor_negative = '#5fb2dc' // state元素的正和负的颜色
        const view2_linkColor = "#f8a1ac", view2_linkColor_hover = '#e35555' // link的颜色
        const view2_hubColor = "#666666" // hub的边框颜色
        const view2_link_width = '2px'


        let view2 = d3.select('.svg')
            .append('g')
            .attr('class', 'view2')
            .attr('transform', `translate(${view2_margin_left}, ${gap_view1_view2 + view2_margin_top})`)


        let chart_g = view2.append('g')
            .attr('transform', `translate(${view2_padding_left_right + 20}, ${view2_padding_top_bottom + view_title_height})`)


        //////////////////画 axis-bottom 的坐标////////////

        // 计算axis—bottom的坐标值，要求是把每组block整个画，把多个step的位置空出来
        let axis_bottom_count = 0
        let steps_arr = Object.values(data).reduce((arr, cur) => {
            let temp_arr = []

            Object.keys(cur).forEach(d => {
                temp_arr.push(axis_bottom_count)
                axis_bottom_count = axis_bottom_count + 1
            })

            let position = 0
            if (temp_arr.length == 0) {
                position = temp_arr[0]
            } else {
                position = (d3.extent(temp_arr)[1] + 1 + d3.extent(temp_arr)[0]) / 2
            }

            arr.push(position)

            return arr
        }, [])




        let scaleX = d3.scaleLinear()
            .domain([0, axis_bottom_count])
            .range([0, view2_width - 2 * view2_padding_left_right])


        chart_g.append('g')
            .attr('class', 'view2_axisBottom')
            .attr('transform', `translate(${0}, ${-20})`)
            .call(d3.axisTop(scaleX)
                .tickValues(steps_arr)
                .tickFormat((_, i) => `Block ${i + 1}`)
            )


        ///////////// 画 axis-left 的坐标轴//////////////////

        let scaleY = d3.scaleLinear()
            .domain([100, 0])
            .range([0, view2_height - 2 * view2_padding_top_bottom])

        chart_g.append('g')
            .attr('class', 'view2_axisLeft')
            .attr('transform', `translate(${-15}, ${0})`)
            .call(d3.axisLeft(scaleY)
                .tickValues([0, 25, 50, 75, 100])
                .tickFormat(d => `${d}%`)
            )


        ////////////// 画 里面的 View2 的主视图///////////////


        let step_data = [] //每一个step的数据都放这里

        Object.entries(data).map(d => {
            let [block_name, block_value] = d

            Object.entries(block_value).forEach(_d => {
                let [step_name, step_value] = _d

                let name = `${block_name}_${step_name}`

                step_data.push({"step_name": name, "block": block_name, ...step_value})
            })
        })




        // 生成 每一个step的单位块， 叫做block
        let block_width = content_width / (step_data.length)



        let block = chart_g.selectAll('.step')
            .data(step_data)
            .join('g')
            .attr('class', d => d['block'])
            .attr('transform', (d, i) => {
                let y = 0
                let x = 0 + i * block_width

                return `translate(${x}, ${y})`
            })
            .on('mouseover', function(){
                d3.select(this).select('.block_bg').attr('fill', '#e3e3e3')
            })
            .on('mouseout', function(){
                d3.select(this)
                    .select('.block_bg')
                    .attr('fill', d => +d['block'].match(/\d+$/)[0] % 2 == 0 ? view2_bgColor_0 : view2_bgColor_1)

            })






        // 画block的灰白相间的背景
        block
            // .attr('transform', `translate(${view2_padding_left_right}, ${view2_padding_top_bottom})`)
            // .selectAll('.null')
            // .data(d=>d)
            .append('rect')
            .attr('x', 0)
            .attr('y', -state_height / 2)
            .attr('width', block_width)
            .attr('height', view2_height - 2 * view2_padding_top_bottom)
            // .attr('fill', d=>+d['block'].match(/\d+$/)[0] % 2 == 0? 'rgb(250,250,250)': '#ffffff')
            .attr('fill', d => +d['block'].match(/\d+$/)[0] % 2 == 0 ? view2_bgColor_0 : view2_bgColor_1)
            .style('cursor', 'pointer')
            .attr('class', function(d){
                return d['hubs']['statehub0']['states']['state0']['post_gate']
            })
            // 点击刷新dandelion chart的函数
            .on('click', function(_,d){
                // console.log(_)
                // console.log(d)
                // console.log(this)
                // console.log(d3.select(this).node())


                // 赋给class gate的种类
                let dandelion_chart_num = d3.selectAll('.bundle_container ').size()

                d3.select(this).attr('id', `dandelion_id_${dandelion_chart_num}`)


                // 更新 dandelion chart的数据值
                let vector_1 = d['statevector']

                // 根据vector_1找vector_2， 即下一个step的 state vector
                let vector_2_index
                step_data.forEach((step, i)=>{
                    if(step['step_name']==d['step_name']){
                        vector_2_index = d3.min([i+1, step_data.length-1])
                    }
                })

                let vector_2 = step_data[vector_2_index]['statevector']
                // console.log(step_data[vector_2_index]['statevector'])


                change_statevector(vector_1, vector_2)

            })





        // 画代表概率相同的 一大块（hub)


        // 画每个hub的 方框
        const hub_width = state_width + 2 * gap_width, hub_height = state_height + gap_width // height多出来的4是缝隙
        const refLine_cap = 8


        // let block2 = block.append('g')


        let hub = block
            .selectAll('.null')
            .data(d => {

                let arr = Object.keys(d['hubs']).map(_d => {
                    return `${d['step_name']}_${_d}`
                })

                return Object.values(d['hubs']).map((d, i) => {
                    return {'name': arr[i], ...d}
                })
            })
            .join('g')
            .attr('class', d => d['name'])
            .attr('transform', d => `translate(${5}, ${scaleY(d['probability'] * 100) - Object.keys(d['states']).length * state_height / 2})`)


        // 画hub的对齐的突出的一小截儿
        hub.append('line')
            .attr('x1', -refLine_cap)
            .attr('y1', d => (Object.keys(d['states']).length * hub_height - gap_width) / 2)
            .attr('x2', state_width + refLine_cap + 2 * gap_width)
            .attr('y2', d => (Object.keys(d['states']).length * hub_height - gap_width) / 2)
            .style('stroke', view2_hubColor)
            .style('stroke-width', 2)
            .style('stroke-linecap', 'round')


        hub.append('rect')
            .attr('x', 0)
            .attr('y', -gap_width)
            .attr('width', hub_width)
            .attr('height', d => Object.keys(d['states']).length * hub_height + gap_width)
            .attr('rx', rx)
            .attr('stroke', view2_hubColor)
            .attr('stroke-width', '2px')
            .attr('fill', '#ffffff')
        // .attr('fill', '#e5e5e5')


        // 画每个state的容器
        let state_g = hub
            .selectAll(`.hub`)
            .data(d => {
                return Object.entries(d['states']).map(_d => {
                    return {
                        'name': `${d['name']}_${_d[0]}`,
                        ..._d[1]
                    }
                })
            })
            .join('g')
            .attr('transform', (d, i) => `translate(${gap_width}, ${(state_height + gap_width) * i})`)
            .style('cursor', 'pointer')


        state_g
            .append('rect')
            .attr('class', d => d['token'])
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', state_width)
            .attr('height', state_height)
            .attr('rx', rx)
            .attr('fill', d => d['positive'] ? view2_stateColor_positive : view2_stateColor_negative)


        // 开始画state的连线

        // let selectArr = [] // 存放所有 link 的classname

        let link = state_g.selectAll('.path')
            .data(d => {

                if (d['children'] == false) {
                    return []
                }

                return d['children'].map(_d => {
                    return {
                        'current': d['token'],
                        'target': _d
                    }
                })

            })
            .join('path')
            .attr("d", function (d, i) {

                // brushing的bug， 如果没有后面的节点，就不画了， 直接退出
                if(!d3.select(`.${d['target']}`).node()){
                    return
                }

                // console.log(123)
                // console.log(d)
                // console.log(d3.select(`.${d['target']}`).node())

                // let target = d3.select(`.${d['target']}`).node()
                // let target_parent = d3.select(`.${d['target']}`).node().parentNode
                // let target_X = +target_parent_parent.getAttribute('transform').split(/[\s,()]+/)[1]

                let current_X = d3.select(`.${d['current']}`).node().getBoundingClientRect()['x']
                let current_Y = d3.select(`.${d['current']}`).node().getBoundingClientRect()['y']
                let target_X = d3.select(`.${d['target']}`).node().getBoundingClientRect()['x']
                let target_Y = d3.select(`.${d['target']}`).node().getBoundingClientRect()['y']


                let x0 = hub_width
                let y0 = hub_height / 2
                let x1 = target_X - current_X
                let y1 = target_Y - current_Y + hub_height / 2


                return "M" + x0 + "," + y0
                    + " " + (x0 + gate_offset) + "," + y0
                    + "C" + (x0 + 50) + "," + y0
                    + " " + (x1 - 20) + "," + y1
                    + " " + x1 + "," + y1;
            })
            .attr('class', d => {

                let class_name = `${d['current']}-${d['target']}`

                selectArr.current.push(class_name)

                return class_name
            }) // e.g., class = "block0_step1_state0-block0_step0_temp"
            .attr('id', 'path_animation')
            .attr('fill', 'none')
            .attr('stroke', view2_linkColor)
            .attr('stroke-width', view2_link_width)
            .attr('stroke-dasharray', 5)


        // 生成每个state 里面的text
        state_g.append('text')
            .html(d => `|${d['state']}&#x27E9`)
            .attr('transform', `translate(${state_width / 3-7}, ${state_height / 1.2})`)
            .style('font-size', '1em')
            .style('fill', '#ffffff')


        // 画每个state后面跟的作用门
        let gate_g = state_g.append('g')
            .attr('transform', `translate(${state_width + gate_offset}, ${state_height / 2})`)
            .attr('class', "gate_g")
            .on('click', function (e, d, f) {

                draw_view3(d, step_data, e)
            })


        gate_g.append('circle')
            .attr("r", gateCircle_radius)
            .attr("cx", 0)
            .attr("cy", 0)
            .style("stroke", "gray")
            .style("stroke-width", 2)
            .style("fill", "#ffffff")


        gate_g.append('text')
            .html(d => d['post_gate'])
            .attr('transform', `translate(${-gateCircle_radius / 2}, ${gateCircle_radius / 2.5})`)
            .style('font-size', '0.9em')
            .style('font-weight', 'bold')
            .style('font-style', 'italic')
            .style('fill', '#636363')






        ////////////////////////  交互 interaction ///////////////////////////////




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
                .attr('id', null)


        })



        // 给state绑定 hover 的交互 ---- 移除前方的所有的link的加粗的线
        state_g.on('mouseout', (d, item)=>{

            link.attr('stroke', view2_linkColor)
                .attr('stroke-width', view2_link_width)
                .attr('stroke-dasharray', 5)
                .attr('id', 'path_animation')


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


    ////////////// 画 弹出的View3 的single-qubit的解释 //////////////////
    function draw_view3(element, data, e) {


        // console.log(element)
        // console.log(data)
        // console.log(e)
        //
        // return


        /////////////// 构造initial state的数组 ////////////
        let initial_state_arr = []
        let final_arr = []


        // 情况一： 后面的gate是H gate， 用来合并两个state为一个state
        if (element['post_gate'] == 'h' && element['children'].length == 1) {

            let initial_arr = []
            initial_arr.push({
                'state': element['state'],
                'negative': !element['positive']
            })


            let children = element['children'][0]
            let step_name = `${element['name'].split('_')[0]}_${element['name'].split('_')[1]}`


            // 找出和同样包含children的state
            data.forEach(step => {
                if (step['step_name'] == step_name) {
                    Object.values(step['hubs']).forEach(statehub => {
                        Object.values(statehub['states']).forEach(state => {
                            if (state['children'].includes(children)) {
                                initial_arr.push({
                                    'state': state['state'],
                                    'negative': !state['positive']
                                })
                            }
                        })
                    })
                }
            })



            // initial_arr = [...new Set(initial_arr)]

            initial_arr = getUniqueListBy(initial_arr, 'state')

            // console.log('initial_arr', initial_arr)


            // 将 state 拆解为 single-qubit state，e.g., ['00', '01'] => [['0'], ['0', '1']]
            initial_state_arr = initial_arr.reduce(function (arr, d) {
                let digit_arr = d['state'].split('')


                if (arr.length == 0) {
                    digit_arr.forEach(() => {
                        arr.push([])
                    })
                }

                digit_arr.forEach((digit, i) => {
                    if (!arr[i].map(_d=>_d['digit']).includes(digit)) {
                        arr[i].push({
                            'digit': digit,
                            'negative': d['negative']
                        })
                    }
                })

                return arr

            }, [])

            // console.log('initial_state_arr', initial_state_arr)


            // return


        }
        // 情况二： 后面的gate是 普通的gate （比如：用来拆分的H gate， ）
        else {

            initial_state_arr = element['state'].split('').map(digit => [{
                'digit': digit,
                'negative': !element['positive']
            }])
        }




        /////////////// 构造gate_arr 的数组 ////////////
        let gate_arr = []

        // gate是Hadamard gate的情况
        if (element['post_gate'] == 'h' || element['post_gate'] == 'x'  || element['post_gate'] == 'cx') {

            gate_arr = initial_state_arr.map((d, i) => {
                if (i == element['act_on']) {
                    return element['post_gate']
                }

                return ''
            })
            // gate是swap gate的情况
        }else if(element['post_gate'] == 's'){
            gate_arr = initial_state_arr.map((d, i) => {
                if (i == element['act_on']) {
                    return 's0'
                }else if (i == element['control']) {
                    return 's1'
                }

                return ''
            })
        }





        /////////////// 构造 final_state_arr 的数组 ////////////

        let final_state_arr = []
        let final_arr_ = []

        // Hadamard gate的操作
        if (element['post_gate'] == 'h') {


            element['children'].forEach(child => {
                final_arr.push(d3.select(`.${child}`).data()[0]['state'])
            })

            element['children'].forEach(child => {
                final_arr_.push(d3.select(`.${child}`).data()[0]['state'])
            })



            final_state_arr = final_arr.reduce(function (arr, d) {
                let digit_arr = d.split('')


                if (arr.length == 0) {
                    digit_arr.forEach(() => {
                        arr.push([])
                    })
                }


                digit_arr.forEach((digit, i) => {
                    if (!arr[i].map(_d=>_d['digit']).includes(digit)) {
                        arr[i].push({
                            'digit': digit,
                            'negative': false
                        })
                    }
                })

                return arr

            }, [])
        }else if(element['post_gate'] == 'x' || element['post_gate'] == 'cx' || element['post_gate'] == 's'){


            element['children'].forEach(child => {
                final_arr_.push(d3.select(`.${child}`).data()[0]['state'])
            })

            element['children'].forEach(child=>{
                final_arr.push(...d3.select(`.${child}`).data()[0]['state'].split(''))
                // console.log(d3.select(`.${child}`).data()[0])
            })


            final_state_arr = final_arr.map(d=>{
                return [{
                    'digit': d,
                    'negative': false
                }]
            })
        }

        // console.log(final_arr_)
        //
        // return




        // 最终用来画图的数组
        let single_qubit_arr = initial_state_arr.map((d, i) => {
            return {
                'initial_digit': d,
                'operation': gate_arr[i],
                'final_digit': final_state_arr[i]
            }
        })

        // console.log(single_qubit_arr)




        //////////////////// 开始 view3 画图 ///////////////////////


        // 定义布局变量
        const layout = layout_attribute.current
        const view3_margin_left = layout['margin_left'] + 20, view3_margin_top = 130
        const view3_block_horizontal_gap = 40


        const cell_width_unit = 35, cell_height_digit = 25, cell_height_operation = 90


        const distance_to_svg_top = view3_margin_top + layout['view1_height'] + layout['view2_height']
        const view3_padding = 8, small_slit = 4
        const view3_gate_trigger_circle = 15
        const inflection_point = 530


        const color_final = '#efefef', color_digit_positive = '#a5dcfd',color_digit_negative = '#4394c1', color_operation_bg = '#dedede'


        // 开始画图
        let view3

        if (d3.selectAll('.view3').size() == 0) {
            view3 = d3.select('.svg')
                .append('g')
                .attr('class', 'view3')
                .attr('transform', `translate(${view3_margin_left}, ${distance_to_svg_top})`)
        } else {
            view3 = d3.select('.view3')
        }


        // 也就是rect的width
        let row_num = single_qubit_arr.reduce((count, d) => {
            count = count + d3.max([d['initial_digit'].length, d['final_digit'].length])

            return count
        }, 0)

        let block_width = cell_width_unit * row_num
        let block_height = 3 * cell_height_digit + cell_height_operation


        // 画 gate 连到single-qubit的线
        d3.select('.svg')
            .append('path')
            .attr("d", function (d, i) {


                let x0 = e.offsetX
                let y0 = e.offsetY
                let x1 = d3.selectAll('.view3_block').size() * (view3_block_horizontal_gap*5) + block_width / 2 + view3_margin_left
                let y1 = distance_to_svg_top + view3_padding


                return "M" + x0 + "," + (y0 + view3_gate_trigger_circle)
                    + "L" + x0 + "," + (inflection_point + d3.selectAll('.view3_line').size()*8)
                    + "L" + x1 + "," + (inflection_point + d3.selectAll('.view3_line').size()*8)
                    + "L" + x1 + "," + y1;
            })
            .attr('class', 'view3_line')
            .attr('fill', 'none')
            .attr('stroke', '#000000')
            .attr('stroke-width', 1)


        // 画连线起始端的 圈gate的小圆圈
        d3.select('.svg')
            .append('circle')
            .attr("r", view3_gate_trigger_circle)
            .attr("cx", e.offsetX)
            .attr("cy", e.offsetY)
            .style("stroke", '#494949')
            .style("stroke-width", 3)
            .style("fill", "none")
            .attr('stroke-dasharray', 4)
            .attr('id', 'path_animation')



        let block_g = view3.append('g')
            .attr('transform', `translate(${d3.selectAll('.view3_block').size() * ( view3_block_horizontal_gap*5)}, ${view3_padding})`)
            .attr('class', `view3_block`)



        // 添加 一行的 g

        let row_g = block_g.selectAll('.null')
            .data(single_qubit_arr)
            .join('g')
            .attr('transform', (d, i) => {
                let width

                if (i == 0) {
                    width = 0
                } else {
                    let row_count = 0
                    for (let i_ = 0; i_ < i; i_++) {
                        row_count = row_count + d3.max([single_qubit_arr[i_]['initial_digit'].length, single_qubit_arr[i_]['final_digit'].length])
                    }

                    width = row_count * cell_width_unit
                }
                return `translate(${width + view3_padding},${view3_padding})`
            })



        // 画每个bloc的边框

        block_g.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', block_width + 2 * view3_padding)
            .attr('height', block_height + view3_padding * 3)
            .attr('stroke', '#000000')
            .attr('stroke-width', '1px')
            .attr('fill', 'none')
            .attr('class', `view3_rect`)


        // 画最后final states的那个竖着的长长的cell
        let final_cell = block_g
            .append('g')
            .attr('transform', `translate(${view3_padding},${block_height + 2 * view3_padding - cell_height_digit})`)
            .datum(final_arr_)


        final_cell
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', block_width)
            .attr('height', cell_height_digit)
            .attr('stroke', 'none')
            // .attr('stroke-width', '4px')
            // .style('stroke-location', 'inside')
            .attr('fill', color_final)



        // text
        final_cell
            .selectAll('.null')
            .data(d => d)
            .join('text')
            // .each(d=>{
            //     console.log(d)
            // })
            .html(d => `|${d}&#x27E9`)
            .attr('transform', (d, i) => `translate(${i * block_width / 2 + cell_width_unit / 2.5},${18})`)
            .style('font-size', '1em')
            .style('font-weight', 'bold')
            // .style('font-style', 'italic')
            .style('fill', '#000000')



        // 添加每个cell的g
        let cell_g = row_g.selectAll('.null')
            .data(d => {

                return Object.values(d).map(_d => {
                    return {
                        'original': d,
                        'data': _d
                    }
                })
            })
            .join('g')
            .attr('class', 'cell')
            .attr('transform', (d, i) => `translate(${0}, ${i == 0 ? 0 : (i == 1 ? cell_height_digit : (i == 2 ? (cell_height_digit + cell_height_operation) : 0))})`)





        // 添加每个cell的后面的背景
        let row_element_count = 0
        let height_stack = []

        row_g.each(d => {
            // console.log(d)
            height_stack.push(cell_width_unit * d3.max([d['initial_digit'].length, d['final_digit'].length]))
        })




        cell_g.append('rect')
            .attr('x', 0)
            .attr('y', small_slit)
            .attr('width', (d, i, t) => {
                let height = height_stack[Math.floor(row_element_count / 3)]
                row_element_count++

                return height - small_slit
            })
            .attr('height', (d, i) => (i == 0 ? cell_height_digit : (i == 1 ? cell_height_operation : (i == 2 ? cell_height_digit : cell_height_digit))) - small_slit)
            .attr('fill', 'none')
            .attr('rx', 5)
            .attr('stroke', (_, i) => i % 2 !== 0 ? color_operation_bg : '#6d6d6d')
            .attr('stroke-width', '2px')





        // 画每个cell里面的text
        cell_g
            .filter((d, i) => Array.isArray(d['data']))
            .selectAll('.null')
            .data(d=>d['data'])
            .join('text')
            .html(d => {
                // console.log(d)
                // if (d['data'].length == 1) {
                //     return `|${d['data'][0]['digit']}&#x27E9`
                // } else if (d['data'].length == 2) {
                //     return `<tspan dx="0" y="0">|${d['data'][0]['digit']}&#x27E9</tspan>
                //             <tspan dx="0.8em" y="0">|${d['data'][1]['digit']}&#x27E9</tspan>`
                // }
                return `|${d['digit']}&#x27E9`
            })
            .attr('transform', (d, i) => {
                // let tall = d3.max([d['original']['initial_digit'].length, d['original']['final_digit'].length])
                // if (d['data'].length == 1 && tall !== 1) {
                //     return `translate(${tall / 2 * cell_width_unit-10}, ${cell_height_digit / 1.4})`
                // }

                return `translate(${cell_width_unit / 4 + i*45}, ${cell_height_digit / 1.4})`

            })
            .style('font-size', '1em')
            .style('font-weight', 'bold')
            // .style('font-style', 'italic')
            .style('fill', d=>d['negative']?color_digit_negative:color_digit_positive)




        // console.log(element)
        // console.log(data)
        //
        // console.log(single_qubit_arr)




        ////////////// 画 operation 的箭头 ///////////


        // x gate 的 operation 线
        if(element['post_gate']== 'x'){

            row_g
                //     .each(d=>{
                //     console.log(d)
                // })
                .filter(d => d['operation'] == '')
                .append('line')
                .attr('x1', cell_width_unit / 2)
                .attr('y1', cell_height_digit + 10)
                .attr('x2', cell_width_unit / 2)
                .attr('y2', cell_height_digit + cell_height_operation-10)
                .style('stroke', color_null)
                .style('stroke-width', 3)
                .attr('stroke-dasharray', 5)
                .attr("marker-end", `url(#${get_marker(color_null)})`)


            row_g
                .filter(d => d['operation'] == 'x')
                .append('line')
                .attr('x1', cell_width_unit / 2)
                .attr('y1', cell_height_digit + 10)
                .attr('x2', cell_width_unit / 2)
                .attr('y2', cell_height_digit + cell_height_operation-10)
                .style('stroke', color_x)
                .style('stroke-width', 3)
                // .attr('stroke-dasharray', 5)
                .attr("marker-end", `url(#${get_marker(color_x)})`)
        }


        // cx gate 的 operation 线
        if(element['post_gate']== 'cx'){

            row_g
                //     .each(d=>{
                //     console.log(d)
                // })
                .filter(d => d['operation'] == '')
                .append('line')
                .attr('x1', cell_width_unit / 2)
                .attr('y1', cell_height_digit + 10)
                .attr('x2', cell_width_unit / 2)
                .attr('y2', cell_height_digit + cell_height_operation-10)
                .style('stroke', color_null)
                .style('stroke-width', 3)
                .attr('stroke-dasharray', 5)
                .attr("marker-end", `url(#${get_marker(color_null)})`)


            row_g
                .filter(d => d['operation'] == 'cx')
                .append('line')
                .attr('x1', cell_width_unit / 2)
                .attr('y1', cell_height_digit + 10)
                .attr('x2', cell_width_unit / 2)
                .attr('y2', cell_height_digit + cell_height_operation-10)
                .style('stroke', color_cx)
                .style('stroke-width', 3)
                // .attr('stroke-dasharray', 5)
                .attr("marker-end", `url(#${get_marker(color_cx)})`)


            // console.log(element)

            // 画control qubit的线
            block_g.append('path')
                .attr("d", function(d, i){

                    let control = element['control']
                    let target = element['act_on']

                    let x0 = view3_padding + cell_width_unit/2 + cell_width_unit*control
                    let y0 = view3_padding + cell_height_digit
                    let x1 = view3_padding + cell_width_unit/2 + cell_width_unit*target
                    let y1 = view3_padding + cell_height_digit + cell_height_operation/2


                    return "M" + x0 + "," + (y0+10)
                        + "C" + x0 + "," + (y0 + 50)
                        + " " + x1 + "," + (y1 - 20)
                        + " " + x1 + "," + (y1 +20)
                })
                .attr('fill', 'none')
                .attr('stroke', +single_qubit_arr[element['control']]['initial_digit'][0]['digit']==1?color_cx_control_on: color_cx_control_off)
                .attr('stroke-width', 3)


        }


        // x gate 的 operation 线
        if(element['post_gate']== 's'){

            row_g
                //     .each(d=>{
                //     console.log(d)
                // })
                .filter(d => d['operation'] == '')
                .append('line')
                .attr('x1', cell_width_unit / 2)
                .attr('y1', cell_height_digit + 10)
                .attr('x2', cell_width_unit / 2)
                .attr('y2', cell_height_digit + cell_height_operation-10)
                .style('stroke', color_null)
                .style('stroke-width', 3)
                .attr('stroke-dasharray', 5)
                .attr("marker-end", `url(#${get_marker(color_null)})`)


            // s0, s1是SWAP gate互换的两个qubit
            let s0, s1
            row_g.each((d,i)=>{
                    if(d['operation']=='s0'){
                        s0 = i
                    }else if(d['operation']=='s1'){
                        s1 = i
                    }
                })



            // 画互换的第一条线
            block_g.append('path')
                .attr("d", function(d, i){

                    let control = element['control']
                    let target = element['act_on']

                    let x0 = view3_padding + cell_width_unit/2 + cell_width_unit*s0
                    let y0 = view3_padding + cell_height_digit
                    let x1 = view3_padding + cell_width_unit/2 + cell_width_unit*s1
                    let y1 = view3_padding + cell_height_digit + cell_height_operation


                    return "M" + x0 + "," + (y0+10)
                        + "C" + x0 + "," + (y0 + 50)
                        + " " + x1 + "," + (y1 - 50)
                        + " " + x1 + "," + (y1-5)
                })
                .attr('fill', 'none')
                .attr('stroke', color_s)
                .attr('stroke-width', 3)
                .attr("marker-end", `url(#${get_marker(color_s)})`)

            // 画互换的第二条线
            block_g.append('path')
                .attr("d", function(d, i){

                    let control = element['control']
                    let target = element['act_on']

                    let x0 = view3_padding + cell_width_unit/2 + cell_width_unit*s1
                    let y0 = view3_padding + cell_height_digit
                    let x1 = view3_padding + cell_width_unit/2 + cell_width_unit*s0
                    let y1 = view3_padding + cell_height_digit + cell_height_operation


                    return "M" + x0 + "," + (y0+10)
                        + "C" + x0 + "," + (y0 + 50)
                        + " " + x1 + "," + (y1 - 50)
                        + " " + x1 + "," + (y1-5)
                })
                .attr('fill', 'none')
                .attr('stroke', color_s)
                .attr('stroke-width', 3)
                .attr("marker-end", `url(#${get_marker(color_s)})`)
        }


        // h gate的operation的线
        if (element['post_gate'] == 'h') {


            // 画左右往右的operation箭头 - 无任何操作 " -> "

            row_g
                //     .each(d=>{
                //     console.log(d)
                // })
                .filter(d => d['operation'] == '')
                .append('line')
                .attr('x1', cell_width_unit / 2)
                .attr('y1', cell_height_digit + 10)
                .attr('x2', cell_width_unit / 2)
                .attr('y2', cell_height_digit + cell_height_operation-10)
                .style('stroke', color_null)
                .style('stroke-width', 3)
                .attr('stroke-dasharray', 5)
                .attr("marker-end", `url(#${get_marker(color_null)})`)




            // // 画左右往右的operation箭头 - H gate 1->2
            let h_line = row_g
                .filter(d => d['operation'] == 'h')
                .filter(d => d['initial_digit'].length == 1 && d['final_digit'].length == 2)


            if(h_line.size()){
                h_line.append('path')
                    .attr("d", function (d, i) {

                        let x0 = cell_width_unit
                        let y0 = cell_height_digit + 10
                        let x1 = cell_width_unit / 2
                        let y1 = cell_height_digit + cell_height_operation-10


                        return "M" + x0 + "," + y0
                            + " " + x0 + "," + (y0 + 10)
                            + "C" + x0 + "," + (y0 + 80)
                            + " " + x1 + "," + (y1 - 70)
                            + " " + x1 + "," + y1;
                    })
                    .attr('fill', 'none')
                    .attr('stroke', color_h)
                    .attr('stroke-width', 3)
                    .attr("marker-end", `url(#${get_marker(color_h)})`)
                // .attr('stroke-dasharray', 5)

                h_line.append('path')
                    .attr("d", function(d, i){

                        let x0 = cell_width_unit
                        let y0 = cell_height_digit+ 10
                        let x1 = 3*cell_width_unit / 2
                        let y1 = cell_height_digit + cell_height_operation-10


                        return "M" + x0 + "," + y0
                            + " " + x0 + "," + (y0 + 10)
                            + "C" + x0 + "," + (y0 + 80)
                            + " " + x1 + "," + (y1 - 70)
                            + " " + x1 + "," + y1;
                    })
                    .attr('fill', 'none')
                    .attr('stroke', color_h)
                    .attr('stroke-width', 3)
                    .attr("marker-end", `url(#${get_marker(color_h)})`)
                // .attr('stroke-dasharray', 5)


                // 在线上面标出gate name
                row_g
                    .append('text')
                    .html(d=>d['operation']?`${d['operation'].toUpperCase()}`:null)
                    .attr('transform', `translate(${cell_width_unit+6}, ${cell_height_digit+cell_height_operation/4})`)
                    .style('font-size', '1.6em')
                    .style('font-weight', 'bold')
                    // .style('font-style', 'italic')
                    .style('fill', color_h)
            }





            // // 画左右往右的operation箭头 - H gate 2->1
            let h_line_2_1 = row_g
                .filter(d => d['operation'] == 'h')
                .filter(d => d['initial_digit'].length == 2 && d['final_digit'].length == 1)


            if(h_line_2_1.size()){
                h_line_2_1.append('path')
                    .attr("d", function (d, i) {

                        let x0 = cell_width_unit / 2
                        let y0 = cell_height_digit + 10
                        let x1 = cell_width_unit
                        let y1 = cell_height_digit + cell_height_operation-10


                        return "M" + x0 + "," + y0
                            + " " + x0 + "," + (y0 + 10)
                            + "C" + x0 + "," + (y0 + 80)
                            + " " + x1 + "," + (y1 - 70)
                            + " " + x1 + "," + y1;
                    })
                    .attr('fill', 'none')
                    .attr('stroke', color_h)
                    .attr('stroke-width', 3)
                    .attr("marker-end", `url(#${get_marker(color_h)})`)
                // .attr('stroke-dasharray', 5)

                h_line_2_1.append('path')
                    .attr("d", function(d, i){

                        let x0 = 3*cell_width_unit / 2
                        let y0 = cell_height_digit + 10
                        let x1 = cell_width_unit
                        let y1 = cell_height_digit + cell_height_operation-10


                        return "M" + x0 + "," + y0
                            + " " + x0 + "," + (y0 + 10)
                            + "C" + x0 + "," + (y0 + 80)
                            + " " + x1 + "," + (y1 - 70)
                            + " " + x1 + "," + y1;
                    })
                    .attr('fill', 'none')
                    .attr('stroke', color_h)
                    .attr('stroke-width', 3)
                    .attr("marker-end", `url(#${get_marker(color_h)})`)
                // .attr('stroke-dasharray', 5)


                // 在线上面标出gate name
                row_g
                    .append('text')
                    .html(d=>d['operation']?`${d['operation'].toUpperCase()}`:null)
                    .attr('transform', `translate(${cell_width_unit+6}, ${cell_height_digit+cell_height_operation/1.2})`)
                    .style('font-size', '1.6em')
                    .style('font-weight', 'bold')
                    // .style('font-style', 'italic')
                    .style('fill', color_h)
            }


            }



        }







        //////////////////// 一些辅助函数 /////////////////




        function get_marker(color) {

            let id = `marker_${color}`

            d3.select('.svg').append("svg:defs").append("svg:marker")
                .attr("id", id)
                .attr("refX", 4)
                .attr("refY", 3)
                .attr("markerWidth", 5)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0 0 L5 3 L0 6")
                .style("stroke", color)
                .style('stroke-width', 1)
                .style("fill", 'none')

            return id
        }


        // 查找所有前方的路径
        function func_query_before(data, root_names, initial_arr) {


            if (typeof root_names == 'string') {//第一次还是 点击的一个值的时候

                let temp_arr = []

                data.forEach(d => {
                    let [_a, tail] = d.split('-')

                    if (tail == root_names) {
                        initial_arr.push(d)
                        temp_arr.push(_a)

                    }
                })


                return func_query_before(data, temp_arr, initial_arr)


            } else {// 从第二次开始

                let temp_arr = []

                root_names.forEach(d => {
                    let [head, _] = d.split('-')

                    data.forEach(_d => {
                        let [_a, tail] = _d.split('-')

                        if (tail == head) {
                            initial_arr.push(_d)
                            temp_arr.push(_a)
                        }
                    })
                })

                if (temp_arr.length == 0) {
                    return initial_arr
                }

                return func_query_before(data, temp_arr, initial_arr)
            }
        }




        //对象去重
        function getUniqueListBy(arr, key) {
            return [...new Map(arr.map(item => [item[key], item])).values()]
        }




        //请求数据函数，基于请求到的数据 调用 render_view 画图
        function render_from_data() {

        let file_name = param_algo

            axios.get(`data/${file_name}.json`)
                // axios.get(`data/temp.json`)
                .then(res => {

                    data.current = res.data

                    render_view(data.current)
                })

        }


        //画图函数
        function render_view(data) {

            const svg_width = 1600, svg_height = 800


            // 绘制 画布
            const svg = d3.select('#svgContainer')
                .append('svg')
                .attr('width', svg_width)
                .attr('height', svg_height)
                .classed('svg', true)


            // 绘制 view1
            draw_view1(data)


            // 绘制 view2
            // draw_view2(data)

        }












        //////////////////////////////////////////////

        // mount 的时候渲染一次
        useEffect(() => {

            render_from_data()

        }, [])





        // 当 algo 更新的时候update
        useEffect(()=>{


            // 跳过第一次 mount
            if(!didMount.current){
                didMount.current = true

                return
            }


            ////////////////////////
            // 删除 view
            d3.select('.svg')
                .remove()


            ///////////////////////


            render_from_data()


            // 绘制 view2
            console.log('View1 update')



        }, [param_algo])


        return (
            <div id="svgContainer"></div>
        )



}


export default View