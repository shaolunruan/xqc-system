import React, { useState, useEffect, useRef  } from 'react';
import axios from 'axios'
import dandelion_chart from "../function/dandelion_chart";
import * as d3 from 'd3'



function Dandelion(){



    //定义是否mount的ref
    const didMount = useRef(false)

    // 数据存这儿
    let data = useRef({})



    // 画 OriginCircuit 的函数
    function draw_dandelionChart(data){



        /////////////// 定义一些变量 ///////////////

        const svg_width = 800, svg_height = 1000


        // 四个prob：0.2， 0.25， 0.05， 0.5
        // let state_vector = [
        //     [0.13, 0.428],
        //     [0.07, -0.495],
        //     [0.1, 0.2],
        //     [0.4, 0.3]
        // ]


        // 四个prob：0.25, 0.25, 0.25, 0.25
        // let state_vector = [
        //     [0.5, 0],
        //     [0.5, 0],
        //     [-0.5, 0],
        //     [0.5, 0]
        // ]


        // 四个prob：0.2， 0.25， 0.05， 0.5
        let state_vector = [
            [0.13, 0.428],
            [0.07, -0.495],
            [0.1, 0.2],
            [0.4, 0.3]
        ]






        // 统计所有出现的states，e.g., ['00', '01', '10', '11']
        let states = Object.values(data).reduce((arr, d)=>{

            Object.values(d).forEach(d0=>{

                Object.values(d0['hubs']).forEach(_d=>{
                    Object.values(_d['states']).forEach(__d=>{
                        if(!arr.includes(__d['state'])){
                            arr.push(__d['state'])
                        }
                    })
                })
            })

            return arr

        }, [])
            .sort()// 按 ['00', '01', '10', '11'] 这样的顺序排序





        // 创建 svg 画布
        let svg = d3.select('#dandelion_container')
            .append('svg')
            .attr('width', svg_width)
            .attr('height', svg_height)
            .attr('class', 'view_svg')





        // 在这里调用 dandelion_chart 函数
        dandelion_chart(state_vector, states, svg, [350, 350], [0,0], 0.1)



    }



    //请求数据函数，基于请求到的数据 调用 render_view 画图
    function render_from_data(){

        axios.get(`data/qiskit_grover_2q.json`)
            // axios.get(`data/temp.json`)
            .then(res=>{

                data.current = res.data


                // 画 dandelion Chart
                draw_dandelionChart(data.current)
            })

    }




    // mount 的时候渲染一次
    useEffect(()=>{

        // 画 dandelion Chart
        render_from_data()

    }, [])



    // 当 algo 更新的时候update
    useEffect(()=>{


        // 跳过第一次 mount
        if(!didMount.current){
            didMount.current = true

            return
        }

    }, [])





    return (
        <div id="dandelion_container"></div>

    )

}

export default Dandelion