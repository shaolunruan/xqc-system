import React, { useState, useEffect, useRef  } from 'react';
import axios from 'axios'
import * as d3 from 'd3'



function View(props){



    //View 2 的画图函数
    function draw_view2(data){


        // 定义 布局 变量
        const view2_margin_top = 30, view2_margin_left = 30
        const view2_width = 1500, view2_height = 400
        const view2_padding_top_bottom = 30, view2_padding_left_right = 30


        const content_width = view2_width - 2*view2_padding_left_right
        const bottomAxis_top = view2_height - view2_padding_top_bottom



        let view2 = d3.select('.svg')
            .append('g')
            .attr('class', 'view2')
            .attr('transform', `translate(${view2_margin_top}, ${view2_margin_left})`)






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


        view2.append('g')
            .attr('class', 'view2_axisBottom')
            .attr('transform', `translate(${view2_padding_left_right}, ${bottomAxis_top})`)
            .call(d3.axisBottom(scaleX)
                .tickValues(steps_arr)
                .tickFormat((_, i)=>`Block ${i+1}`)
            )





        ///////////// 画 axis-left 的坐标轴//////////////////

        let scaleY = d3.scaleLinear()
            .domain([100, 0])
            .range([0, view2_height - 2*view2_padding_top_bottom])

        view2.append('g')
            .attr('class', 'view2_axisLeft')
            .attr('transform', `translate(${view2_padding_left_right-15}, ${view2_padding_top_bottom})`)
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

        console.log(step_data)


        // 生成 每一个step的单位块， 叫做block
        let block_width = content_width / (step_data.length)


        let block = view2.selectAll('.step')
            .data(step_data)
            .join('g')
            .attr('class', d=>d['block'])
            .attr('transform', (d, i)=>{
                let y = view2_padding_top_bottom
                let x = view2_padding_left_right + i*block_width

                return `translate(${x}, ${y})`
            })




        // 画block的灰白相间的背景
        block.append('rect')
            .attr('x', 0)
            .attr('y', -20)
            .attr('width', block_width)
            .attr('height', view2_height - 2*view2_padding_top_bottom+15)
            .attr('fill', d=>+d['block'].match(/\d+$/)[0] % 2 == 0? 'rgb(250,250,250)': '#ffffff')





        // 画代表概率相同的 一大块（hub)
        const state_width = 80, state_height = 40

        let hub = block
            .selectAll('g')
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
            .attr('transform', d=>`translate(${0}, ${scaleY(d['probability']*100)})`)



        // 画每个hub的 方框
        hub.append('rect')
            .attr('x', 5)
            .attr('y', d=>-Object.keys(d['states']).length * state_height/2)
            .attr('width', state_width + 5)
            .attr('height', d=>Object.keys(d['states']).length * state_height)
            .attr('rx', 8)
            .attr('fill', '#e5e5e5')







    }


    //请求数据函数，基于请求到的数据 调用 render_view 画图
    function render_from_data(){

        axios.get(`data/qiskit_grover_2q.json`)
            .then(res=>{
                render_view(res.data)
            })

    }










    //画图函数
    function render_view(data){

        const svg_width = 1500, svg_height = 1500


        // 绘制 画布
        const svg = d3.select('#svgContainer')
            .append('svg')
            .attr('width', svg_width)
            .attr('height', svg_height)
            .classed('svg', true)


        // 绘制 view2
        draw_view2(data)

    }









    // mount 的时候渲染一次
    useEffect(()=>{

        render_from_data()

    }, [])





    return (
        <div id="svgContainer"></div>
    )

}

export default View