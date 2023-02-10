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

        const bottomAxis_top = view2_height - view2_padding_top_bottom



        let view2 = d3.select('.svg')
            .append('g')
            .attr('class', 'view2')
            .attr('transform', `translate(${view2_margin_top}, ${view2_margin_left})`)


        //画 axis-bottom 的坐标

        // 计算axis—bottom的坐标值，要求是把每组block整个画，把多个step的位置空出来
        let axis_bottom_count = 0
        let steps_arr = Object.values(data).reduce((arr, cur)=>{
            let steps_arr = []

            Object.keys(cur).forEach(d=>{
                steps_arr.push(axis_bottom_count)
                axis_bottom_count = axis_bottom_count+1
            })

            arr.push(steps_arr.reduce((a, b) => a + b, 0) / steps_arr.length)

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
                .tickFormat((_, i)=>`Step ${i+1}`)
            )





        // 画 axis-left 的坐标轴

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



        // 画 里面的 View2 的主视图




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